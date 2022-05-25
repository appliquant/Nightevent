require("dotenv").config();
const { V2 } = require('paseto');
const { errors } = require("paseto");

const MongoClient = require('mongodb').MongoClient;

const { userExists } = require("../register-process/register");

// Mongodb credentials
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

/**
 * Validate recovery token
 * @param {object} data - object containing information about user
 */
async function validate_recover_token(data) {
    const uri = `mongodb+srv://${dbUsername}:${dbPassword}@event-ground-cluster-01.dlyqm.azure.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();

        let token = data.token;
        token = "v2.local." + `${token}`;

        // Decrypt token
        const pasetoBufferHex = process.env.PASETO_BUFFER_HEX;
        const decryptedPayload = await V2.decrypt(token, Buffer.from(pasetoBufferHex.toString("hex"), "hex"));
        console.log(decryptedPayload.email);
        
        // Check if email exists
        const isUserExists = await userExists(client, decryptedPayload.email);

        if (isUserExists) {
            // prompt for new password
            return Promise.resolve(true);

        } else {
            return Promise.resolve(1);
        }

    } catch (err) {
        if (err instanceof errors.PasetoError) {
            console.log(`[validate.js] Paseto error: ${err.stack}`);
            return Promise.resolve(2);
        } else {
            console.log(`[validate.js] Unknown Error: ${err.stack}`);
        }
    } finally {
        await client.close();
    }
}

exports.validate_recover_token = validate_recover_token;