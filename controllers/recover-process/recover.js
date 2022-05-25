require("dotenv").config();
const MongoClient = require('mongodb').MongoClient;

const validator = require("validator");

const { userExists,
        generatePasetoSecret,
        generatePasetoToken,
        generatePasetoUri } = require("../register-process/register");
const { sendRecoverEmail } = require("../register-process/send-email");

// Postmark credentials
const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;

// Mongodb credentials
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

/**
 * Send recover token to user email address
 * @param {object} data - object containing information about user
 */
async function recover_user(data) {

    const uri = `mongodb+srv://${dbUsername}:${dbPassword}@event-ground-cluster-01.dlyqm.azure.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();

        let email = validator.rtrim(data.email);
        email = validator.ltrim(email);

        // Check if email exists
        const isUserExists = await userExists(client, email);

        if (isUserExists) {
            // User exists
            // Generate recover link
            // Thens send recover email

            // Paseto paylaoad
            const pasetoPayload = {
                email: data.email
            };

            // Generate Paseto Secret
            const pasetoSecret = await generatePasetoSecret();
            if (!pasetoSecret) { return Promise.resolve(1); }

            // Generate new activation token with Paseto
            const pasetoToken = await generatePasetoToken(pasetoPayload, pasetoSecret);
            if (!pasetoToken) { return Promise.resolve(1); }

            // Generate Paseto uri
            let newPasetoUri = await generatePasetoUri(pasetoToken, true);
            newPasetoUri = newPasetoUri.split("v2.local.");

            // Send Paseto token by email (via Postmark)
            const sendToken = await sendRecoverEmail(POSTMARK_API_KEY, data.email, `${newPasetoUri[0]}${newPasetoUri[1]}`);
            if (!sendToken) { return Promise.resolve(2); }

            console.log(`[recover.js] Sent recover link`);
            return Promise.resolve(true);


        } else {
            // User doesn't exists
            return Promise.resolve(3);
        }


    } catch (err) {
        console.log(`[recover.js] Unknow error: ${err}`.stack);
        return Promise.reject();    
    } finally {
        await client.close();
    }
}

exports.recover_user = recover_user;