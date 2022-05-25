const express = require("express");
const router = express.Router();

const { V2 } = require('paseto');
const { errors } = require("paseto");

const MongoClient = require('mongodb').MongoClient;
const { userExists } = require("../controllers/register-process/register");

// Mongodb credentials
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

router.get("/1/", (req, res) => {
    const page = req.originalUrl;
    res.send(`The page ${page} doesn't exist! ¯\_(ツ)_/¯`);
});

router.get("/1/:token", async (req, res) => {

    const uri = `mongodb+srv://${dbUsername}:${dbPassword}@event-ground-cluster-01.dlyqm.azure.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        let token = req.params.token;
        token = "v2.local." + `${token}`;


        // Decrypt token
        const pasetoBufferHex = process.env.PASETO_BUFFER_HEX;
        const decryptedPayload = await V2.decrypt(token, Buffer.from(pasetoBufferHex.toString("hex"), "hex"));
        
        // Check if email exists
        const checkinDb = await userExists(client, decryptedPayload.email);

        if (checkinDb) {
            // Check if account is already activated  
            const alreadyActivated = await checkIfActivated(client, decryptedPayload.email);

            if (alreadyActivated) { res.redirect(200, "/login"); } 
            else {
                // Update record in databaase            
                const r = await updateRecord(client, decryptedPayload.email, { activated: true } );
                if (!r) { res.send(500); } 
            
                res.redirect(200, "/login");
            }
        } else {
            res.sendStatus(400);
        }


    } catch (err) {

        if (err instanceof errors.PasetoError) {
            console.log(`[route-validate-token.js] Paseto error: ${err.stack}`);
            res.sendStatus(400);
        } else {
            console.log(`[route-validate-token.js] Unknown Error: ${err.stack}`);
            res.sendStatus(500);
        }
    } finally {
        await client.close();
    }
});

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

/**
 * Check if account is already activated
 * @param {MongoClient} client - Mongodb Client 
 * @param {string} email - Email address of client 
 */
async function checkIfActivated(client, email) {
    const r = await client.db(dbName).collection(collectionName)
        .findOne({ email: email});
    
    if (r.activated) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
}

exports.routeRegistationToken = router;