const MongoClient = require('mongodb').MongoClient;

const colors = require('colors');
const validator = require("validator");

const bcrypt = require('bcrypt');
const { V2 } = require('paseto');
const crypto = require("crypto");
require('dotenv').config();

const { sendConfirmationEmail } = require("./send-email");

// https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Password_Storage_Cheat_Sheet.md#bcrypt
const saltRounds = 12;

const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;

// Is random filled with crypto.randomFill()
const pasetoBufferHex = process.env.PASETO_BUFFER_HEX;

// Colors theme (from nodejs.org)
colors.setTheme({
    success: 'bgBlue',
    // error: 'bgRed',
    error: 'red',
    warn: 'yellow',

    sysinfo: 'bgGreen',
    info: 'green'
});

/**
 * Register user to database
 * @param {object} data - object containing information about user
 */
async function register_user(data) {

    const uri = `mongodb+srv://${dbUsername}:${dbPassword}@event-ground-cluster-01.dlyqm.azure.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();

        console.log(`Connected to db: "${dbName}".`.info);

        // Serialize inputs
        let name = validator.rtrim(data.name);
        name = validator.ltrim(name);
        let orgname = validator.rtrim(data.orgname);
        orgname = validator.ltrim(orgname);
        let email = validator.rtrim(data.email);
        email = validator.ltrim(email);
        let unhashedPassword = data.password;

        if (!validator.isEmail(email)) { return Promise.resolve(1); }
        if (!validator.isLength(unhashedPassword, { min: 8, max: 32 })) { return Promise.resolve(2); }

        // Check if user exists
        const userIs = await userExists(client, email);
        console.log(`Check if user email exists: ${userIs}`);

        if (userIs) {
            return Promise.resolve(3);
        } else {

            // Hash password
            const hashedPassword = await bcrypt.hash(unhashedPassword, saltRounds);
            if (!hashedPassword) { return Promise.resolve(4); }

            console.log(`Password hash generated`);

            // Paseto payload
            const pasetoPayload = {
                email: email
            };
            console.log(`Paseto payload loaded`);

            // Paseto secret
            // (local) https://developer.okta.com/blog/2019/10/17/a-thorough-introduction-to-paseto
            const pasetoSecret = await generatePasetoSecret();
            if (!pasetoSecret) { return Promise.resolve(5); }

            console.log(`Paseto secret generated`);

            // Generate activation token with Paseto
            const pasetoToken = await generatePasetoToken(pasetoPayload, pasetoSecret);
            if (!pasetoToken) { return Promise.resolve(5); }

            console.log(`Paseto token generated`);

            // Generate Paseto uri
            let pasetoUri = await generatePasetoUri(pasetoToken);
            pasetoUri = pasetoUri.split("v2.local.");

            console.log(`Paseto uri generated`);

            // Send Paseto token by email (Postmark)
            const sendToken = await sendConfirmationEmail(POSTMARK_API_KEY, email, `${pasetoUri[0]}${pasetoUri[1]}`, name);
            if (!sendToken) { return Promise.resolve(6); }

            console.log(`Email sent: ${sendToken}`);

            // Add user to DB 
            const r = await addUser(client, {
                createdAt: Date(),
                name: name,
                organisation: orgname,
                email: email,
                activated: false,
                activationLink: pasetoToken,
                password: hashedPassword,
            });

            if (!r) { return Promise.resolve(7); }

            return Promise.resolve(true);
        }

    } catch (err) {
        console.error(`[register.js] Error: ${err}`.error.stack);
    } finally {
        await client.close();
    }
}


// https://developer.mongodb.com/quickstart/node-crud-tutorial
/**
 * Check if user email exists in db
 * @param {MongoClient} client - MongoClient client process of mongodb
 * @param {string} email - Client email address
 */
async function userExists(client, email) {

    const r = await client.db(dbName).collection(collectionName)
        .findOne({ email: email });
    
    if (r) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
}

/**
 * Add user to database
 * @param {MongoClient} client - MongoClient client process of mongodb
 * @param {object} newListing - User object
 */
async function addUser(client, newListing) {
    const r = await client.db(dbName).collection(collectionName).insertOne(newListing);
  
    if (r) {
      console.log(`Added new user to database.`.sysinfo)
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
}

/**
 * Returns a buffer for generatePasetoToken()
 */
async function generatePasetoSecret() {
    return Promise.resolve(crypto.createSecretKey(Buffer.from(pasetoBufferHex.toString('hex'), 'hex')));
}

/**
 * Generate PASETO token
 * @param {object} payload - The payload containing information - Object  
 * @param {Buffer} secret - Paseto secret key - Buffer
 * @ Token expires after 1 day. 
*/
async function generatePasetoToken(payload, secret) {
    const token = await V2.encrypt(payload, secret,
        { expiresIn: "1 day" });

    if (token) { return Promise.resolve(token); }
    else { return Promise.resolve(false); }
}

/**
 * Generate uri to send by email
 * @param {string} token - Token generated by generatePasetoToken() 
 * @param {boolean} [recover] - Optional, set to true if it's for a recover link, else ignore it
 */
async function generatePasetoUri(token, recover) {
    if (recover) {
        // slash "/" included
        const uri = `${process.env.WEB_APP_URI}2/${token}`;
        return Promise.resolve(uri);
    } else {
        // slash "/" included
        const uri = `${process.env.WEB_APP_URI}1/${token}`;
        return Promise.resolve(uri);
    }
}

exports.register_user = register_user;
exports.generatePasetoSecret = generatePasetoSecret;
exports.generatePasetoToken = generatePasetoToken;
exports.generatePasetoUri = generatePasetoUri;
exports.userExists = userExists;