const postmark = require("postmark");
const colors = require('colors');

colors.setTheme({
    success: 'bgBlue',
    // error: 'bgRed',
    error: 'red',
    warn: 'yellow',

    sysinfo: 'bgGreen',
    info: 'green'
});
/**
 * Send activation link email with Postmark
 * @param {string} apikey - Api key of Postmark
 * @param {string} email - User email 
 * @param {String} link - Activation link 
 * @param {string} [name] - User name - Optional
 */
async function sendConfirmationEmail(apikey, email, link, name) {
    try {
        // Send an email:
        let client = new postmark.ServerClient(apikey);

        // If "name" is not specified
        if (typeof name === "undefined" || null) {
            
            // Send
            let r = await client.sendEmailWithTemplate({
                TemplateId: 19355979,
                From: "noreply@nightevent.me",
                To: email,
                templateModel: {
                    link: link,
                    support_url: "https://nightevent.me/support",
                    product_name: "Night Event"
                }
            });

            if (r) {
                console.log(`[send-email.js] Email sent.`);
                return Promise.resolve(true);
            } else {
                console.log(`[send-email.js] Email not sent.`);
                return Promise.resolve(false);
            
            }
        } else {
            // Send email
            let r = await client.sendEmailWithTemplate({
                TemplateId: 19326457,
                From: "noreply@nightevent.me",
                To: email,
                templateModel: {
                    name: name,
                    link: link,
                    support_url: "https://nightevent.me/support",
                    product_name: "Night Event"
                }
            });

            if (r) {
                console.log(`[send-email.js] Email sent.`);
                return Promise.resolve(true);
            } else {
                console.log(`[send-email.js] Email not sent.`);
                return Promise.resolve(false);
            }
        }

    } catch (err) {

        if (err instanceof postmark.Errors.UnknownError) {
            console.log(`[send-email.js] Error(2) Unknown Postmark error: ${err.stack}`.error);
            return Promise.resolve(false);
        }

        else if (err.name === "ApiInputError") {
            console.log(`[send-email.js] Error(2.1): ${err.stack}`.error);
            return Promise.resolve(false);
        }

        else {
            console.log(`[send-email.js] Error(2.2): ${err.stack}.`.error);
            return Promise.resolve(false);
        }
    }
}

/**
 * Send recover link email with Postmark
 * @param {string} apikey - Api key of Postmark
 * @param {string} email - User email 
 * @param {String} link - Recover link 
 */
async function sendRecoverEmail(apikey, email, link) {
    try {
        // Send an email:
        let client = new postmark.ServerClient(apikey);

        // Send email
        let r = await client.sendEmailWithTemplate({
            TemplateId: 19514392,
            From: "noreply@nightevent.me",
            To: email,
            templateModel: {
                email: email,
                link: link,
                support_url: "https://nightevent.me/support",
                product_name: "Night Event"
            }
        });

        if (r) {
            console.log(`[send-email.js] Email sent.`);
            return Promise.resolve(true);
        } else {
            console.log(`[send-email.js] Email not sent.`);
            return Promise.resolve(false);
        }
        
    } catch (err) {
        if (err instanceof postmark.Errors.UnknownError) {
            console.log(`[send-email.js] Error(3) Unknown Postmark error: ${err.stack}`.error);
            return Promise.resolve(false);
        }

        else if (err.name === "ApiInputError") {
            console.log(`[send-email.js] Error(3.1): ${err.stack}`.error);
            return Promise.resolve(false);
        }

        else {
            console.log(`[send-email.js] Error(3.2): ${err.stack}.`.error);
            return Promise.resolve(false);
        }
    }
}

exports.sendConfirmationEmail = sendConfirmationEmail;
exports.sendRecoverEmail = sendRecoverEmail;