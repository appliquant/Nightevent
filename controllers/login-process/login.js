require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const colors = require('colors');
const validator = require("validator");
const bcrypt = require('bcrypt');


const { sendConfirmationEmail } = require("../register-process/send-email");
const { userExists,
    generatePasetoToken,
    generatePasetoSecret,
    generatePasetoUri } = require("../register-process/register");


// Colors theme (from nodejs.org)
colors.setTheme({
    success: 'bgBlue',
    error: 'red',
    warn: 'yellow',
    sysinfo: 'bgGreen',
    info: 'green'
});

// Db credentials
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

// Postmark credentials
const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;

/**
 * Login user to website
 * @param {object} data - object containing information about user
 */
async function login_user(data) {
    
    const uri = `mongodb+srv://${dbUsername}:${dbPassword}@event-ground-cluster-01.dlyqm.azure.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {

        // Connect to mongodb
        await client.connect();
        console.log(`Connected to db: "${dbName}".`.info);

        // Serialize inputs
        let email = validator.rtrim(data.email);
        email = validator.ltrim(email);
        const unhashedPassword = data.password;

        if (!validator.isEmail(email)) { return Promise.resolve(1); }
        if (!validator.isLength(unhashedPassword, { min: 8, max: 32 })) { return Promise.resolve(2); }

        // Check if user exists
        const isUserExistant = await userExists(client, email);

        if (!isUserExistant) { return Promise.resolve(3); } 
        else {
            // User exists
            
            // Check if password is valid
            const isPasswordValid = await passwordCheck(client, email, unhashedPassword);
            if (!isPasswordValid) { return Promise.resolve(4); }

            // Check if user account is activated
            const isAccountActivated = await accountActivated(client, email);

            if (!isAccountActivated) {

                // Account is not activated
                // Deleter old activation uri - send new

                // Paseto paylaoad
                const pasetoPayload = {
                    email: email
                };

                // Generate Paseto Secret
                const pasetoSecret = await generatePasetoSecret();
                if (!pasetoSecret) { return Promise.resolve(5); }

                // Generate new activation token with Paseto
                const pasetoToken = await generatePasetoToken(pasetoPayload, pasetoSecret);
                if (!pasetoToken) { return Promise.resolve(5); }

                // Generate Paseto uri
                let newPasetoUri = await generatePasetoUri(pasetoToken);
                pasetoUri = pasetoUri.split("v2.local.");
                
                // Update old paseto uri (confirmation)
                const updateLink = await updateDocument(client, email, newPasetoUri);
                if (!updateLink) { return Promise.resolve(6); }

                // Send an other activation link
                const sendToken = await sendConfirmationEmail(POSTMARK_API_KEY, email, `${pasetoUri[0]}${pasetoUri[1]}`, null);
                if (!sendToken) { return Promise.resolve(7); }

                // Return account not activated error
                return Promise.resolve(8);


            } else {
                // Login
                console.log(`User "${email}" logged in`.sysinfo);
                return Promise.resolve(true);
            }
        }



    } catch (err) {
        console.error(`[login.js] Unknow error: ${err}`.error.stack);
    } finally {
        await client.close();
    }
}

/**
 * Check if user account is activated - Assuming email exists in db
 * @param {MongoClient} client - MongoClient client process of mongodb
 * @param {string} email - Client email address
 */
async function accountActivated(client, email) {

    const r = await client.db(dbName).collection(collectionName)
        .findOne({ email: email, activated: true });

    if (r) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
}

/**
 * Check if password provided by user is same as one in db
 * @param {MongoClient} client - MongoClient client process of mongodb
 * @param {string} email - Client email address
 * @param {*} userPassword - Unhashed (plaintext) password of user
 */
async function passwordCheck(client, email, userPassword) {
    const r = await client.db(dbName).collection(collectionName)
        .findOne({ email: email });
    const m = await bcrypt.compare(userPassword, r.password);

    if (m) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }

}

/**
 * Update old Paseto uri with new uri (to activate account)
 * @param {MongoClient} client - MongoClient client process of mongodb
 * @param {string} email - Client email address
 * @param {string} pasetoUri - New paseto uri
 */
async function updateDocument(client, email, pasetoUri) {
    const r = await client.db(dbName).collection(collectionName).updateOne(
        { email: email },
        {
            $set: { activationLink: pasetoUri }
        });
    
    if (r) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
}

exports.login_user = login_user;