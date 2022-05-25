require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

const validator = require("validator");

const { V2 } = require('paseto');
const { errors } = require("paseto");
const bcrypt = require("bcrypt");

// https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Password_Storage_Cheat_Sheet.md#bcrypt
const saltRounds = 12;

// Mongodb credentials
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

/**
 * Update old password with new one
 * @param {object} data - object containing information about user
 */
async function update_password(data) {
    const uri = `mongodb+srv://${dbUsername}:${dbPassword}@event-ground-cluster-01.dlyqm.azure.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    try {
        // At this point we know that the user exists
        // We only need to update his password within the database
        
        await client.connect();

        // Serialize inputs
        const unhashedPassword = data.password;
        const x = data.token;
        const y = x.split("/2/")[1];
        const token = "v2.local." + `${y}`;
        // console.log(`password: ${unhashedPassword}\ntoken: ${token}`);

        if (!validator.isLength(unhashedPassword, { min: 8, max: 32 })) { return Promise.resolve(1); }

        // Decrypt token
        const pasetoBufferHex = process.env.PASETO_BUFFER_HEX;
        const decryptedPayload = await V2.decrypt(token, Buffer.from(pasetoBufferHex.toString("hex"), "hex"));
        console.log(`Email >> ${decryptedPayload.email}`);

        // Hash password
        const hashedPassword = await bcrypt.hash(unhashedPassword, saltRounds);
        if (!hashedPassword) { return Promise.resolve(2); }

        // Update record in databaase            
        const r = await updateRecord(client, decryptedPayload.email, { password: hashedPassword } );
        if (!r) { return Promise.resolve(3); }

        return Promise.resolve(true); 
        
    } catch (err) {
        if (err instanceof errors.PasetoError) {
            console.log(`[update-password.js] Paseto error: ${err.stack}`);
        } else {
            console.log(`[update-password.js] Unknown Error: ${err.stack}`);
        }
    } finally {
        await client.close();
    }

}

/**
 * Update user record in database
 * @param {MongoClient} client - Mongodb Client 
 * @param {string} email - Email address of client 
 * @param {object} updatedListing - What to update
 */
async function updateRecord(client, email, updatedListing) {
    const r = await client.db(dbName).collection(collectionName)
        .updateOne({ email: email }, { $set: updatedListing });
    if (r) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
}

exports.update_password = update_password;