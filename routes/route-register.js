const express = require("express");
const colors = require('colors');
const router = express.Router();

const { register_user } = require("../controllers/register-process/register");

// Colors theme (from nodejs.org)
colors.setTheme({
    success: 'bgBlue',
    // error: 'bgRed',
    error: 'red',
    warn: 'yellow',

    sysinfo: 'bgGreen',
    info: 'green'
});

// Register
router.get("/register", (req, res) => {
    res.render("connection-register/register", {
        message: null
    });
});

router.post("/register", async (req, res) => {

    const register_data = {
        name: req.body.fullname,
        orgname: req.body.orgname,
        email: req.body.email,
        password: req.body.password
    };
    
    const register_error_codes = {
        invalidEmailError: "Please use a valid email address",
        passwordLengthError: "Password length must be between 8 and 32 characters.",
        userExistsError: "Email already exists. Try another.",
        bcryptError: "An error happend, please try later",
        pasetoError: "An error happend, please try later.",
        postmarkError: "An error happend, please try later.",
        mongoDbError: "An error happend, please try later.",
        success: "Successful. A link to activate your account has been emailed to your email address.",
        unknown: "An error happend, please try later."
    };

    try {
        const r = await register_user(register_data);
        console.log(`[route-register.js] r: ${r}`);
        
        switch (r) {
            case 1:
                console.error("[route-register.js] Invalid email error.".error);
                res.render("connection-register/register", {
                    message: register_error_codes.invalidEmailError
                });
                break;
            case 2:
                console.error("[route-register.js] Password length error.".error);
                res.render("connection-register/register", {
                    message: register_error_codes.passwordLengthError
                });
                break;
            case 3:
                console.error("[route-register.js] Users exists error.".error);
                res.render("connection-register/register", {
                    message: register_error_codes.userExistsError
                });
                break;
            case 4:
                console.error("[route-register.js] Bcrypt error.".error);
                res.render("connection-register/register", {
                    message: register_error_codes.bcryptError
                });
                break;
            case 5:
                console.error("[route-register.js] Paseto error.".error);
                res.render("connection-register/register", {
                    message: register_error_codes.pasetoError
                });
                break;
            case 6:
                console.error("[route-register.js] Postmark error.".error);
                res.render("connection-register/register", {
                    message: register_error_codes.postmarkError
                });
                break;
            case 7:
                console.error("[route-register.js] Mongodb error.".error);
                res.render("connection-register/register", {
                    message: register_error_codes.mongoDbError
                });
                break;
            case true:
                res.render("connection-register/register", {
                    message: register_error_codes.success
                });
                break; 
            default:
                console.error("[route-register.js] Unknow error? (Check mongodb uri).".error);
                res.render("connection-register/register", {
                    message: register_error_codes.unknown
                });
                break;
        }

    } catch (err) {
        console.error(`[route-register.js] Error: ${err.stack}`.error)
        res.render("connection-register/register", {
            message: register_error_codes.unknown
        });
    }
});

exports.routeRegister = router;