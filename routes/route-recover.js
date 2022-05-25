require("dotenv").config();
const express = require("express");
const router = express.Router();

const { recover_user } = require("../controllers/recover-process/recover");
const { validate_recover_token } = require("../controllers/recover-process/validate");
const { update_password } = require("../controllers/recover-process/update-password");

// Recover page
router.get("/recover", (req, res) => {
    res.render("connection-register/password-reset", {
        message: null
    });
});

// Send recover token with email
router.post("/recover", async (req, res) => {
    const recover_error_codes = {
        pasetoError: "An error happend, please try later.",
        postmarkError: "An error happend, please try later.",
        success: "If email is in our database, we'll send you a recover link. Make sure to check your emails. (And spam)",
        nonExistentUserError: "If email is in our database, we'll send you a recover link. Make sure to check your emails. (And spam)",
        unknown: "An error happend, please try later."
    };

    const recover_data = {
        email: req.body.email
    };

    try {
        const r = await recover_user(recover_data);

        switch (r) {
            case 1:
                console.log(`[route-recover.js] Paseto error`);
                res.render("connection-register/password-reset", {
                    message: recover_error_codes.pasetoError
                });
                break;
            case 2:
                console.log(`[route-recover.js] Postmark error`);
                res.render("connection-register/password-reset", {
                    message: recover_error_codes.postmarkError
                });
                break;
            case 3:
                console.log(`[route-recover.js] User doesn't exists error`);
                res.render("connection-register/password-reset", {
                    message: recover_error_codes.nonExistentUserError
                });
                break;
            case true:
                res.render("connection-register/password-reset", {
                    message: recover_error_codes.success
                });
                break;
            default:
                console.log("[route-recover.js] Unknown error? (Check mongodb uri).");
                res.render("connection-register/login", {
                    message: recover_error_codes.unknown
                });
                break;
        }

    } catch (err) {
        console.log(`[route-recover.js] (/recover) POST Error: ${err}`);
        res.render("connection-register/password-reset", {
            message: recover_error_codes.unknown
        });
    }
});

// Error message
router.get("/2/", (req, res) => {
    const page = req.originalUrl;
    res.send(`The page ${page} doesn't exist! ¯\_(ツ)_/¯`);
});

// Validate recover token sent by email and propmt for new password
router.get("/2/:token", async (req, res) => {
    const validate_data = {
        token: req.params.token
    };

    try {
        const r = await validate_recover_token(validate_data);

        switch (r) {
            case 1:
                console.log(`[route-recover.js] - (/2/:token) GET - User non existant error`);
                res.sendStatus(400);
                break;
            case 2:
                console.log(`[route-recover.js] - (/2/:token) GET - Postmark error`);
                res.sendStatus(400);
                break;
            case true:
                res.render("connection-register/new-password", {
                    message: null
                });
                break;
            default:
                res.sendStatus(500);
                break;
        }

    } catch (err) {
        console.log("[route-recover.js] - (/2/:token) GET - Unknown error? (Check mongodb uri).".stack);
        res.render("connection-register/login", {
            message: "An error happend, please try later."
        });
    }
});

// Update old password with new one
router.post("/2/", async (req, res) => {
    const validate_errors_codes = {
        passwordLengthError: "Password length must be between 8 and 32 characters.",
        bcryptError: "An error happend, please try later",
        updateRecordsError: "An error happend, please try later.",
        success: "Password updated, you can now login",
        unknown: "An error happend, please try later."
    };

    const validate_data = {
        password: req.body.password,
        token: req.headers.referer
    };

    try {
        const r = await update_password(validate_data);

        switch (r) {
            case 1:
                console.log("[route-recover.js] - (/2/) POST - Password length error");
                res.render("connection-register/login", {
                    message: validate_errors_codes.passwordLengthError
                });
                break;
            case 2:
                console.log("[route-recover.js] - (/2/) POST - bcrypt error");
                res.render("connection-register/login", {
                    message: validate_errors_codes.bcryptError
                });
                break;
            case 3:
                console.log("[route-recover.js] - (/2/) POST - update records error");
                res.render("connection-register/login", {
                    message: validate_errors_codes.updateRecordsError
                });
                break;
            case true:
                res.redirect("/login");
                break;
            default:
                console.log("[route-recover.js] - (/2/) POST - Unknown error");
                res.render("connection-register/new-password", {
                    message: validate_errors_codes.unknown
                });
                break;
        }

    } catch (err) {
        console.log(`[route-recover.js] - (/2/) POST - Unknown error? (Check mongodb uri): ${err}`.stack);
        res.render("connection-register/new-password", {
            message: validate_errors_codes.unknown
        });
    }
});

exports.routeRecover = router;