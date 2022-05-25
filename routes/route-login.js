const express = require("express");
const router = express.Router();
const colors = require("colors");
require("dotenv").config();

const { login_user } = require("../controllers/login-process/login");

// Colors theme (from nodejs.org)
colors.setTheme({
    success: 'bgBlue',
    error: 'red',
    warn: 'yellow',
    sysinfo: 'bgGreen',
    info: 'green'
});

router.get("/login", (req, res) => {
    const sess = req.session;
    if (sess.loggedin) {
        res.redirect('/d/dashboard');
    } else {
        res.render("connection-register/login", {
            message: null
        });
    }
});

router.post("/login", async (req, res) => {
    const sess = req.session;
    if (sess.loggedin) {
        res.redirect('/d/dashboard');
    } else {

        const login_data = {
            email: req.body.email,
            password: req.body.password
        };

        const login_error_codes = {
            notValidEmailError: "Please use a valid email address",
            passwordLengthError: "Please write a valid password. Between 8 and 32 characters",
            nonExistentUserError: "Wrong email or/and password.",
            invalidPasswordError: "Wrong email or/and password.",
            pasetoError: "An error happend, please try later.",
            documentUpdateError: "An error happend, please try later.",
            postmarkError: "An error happend, please try later.",
            accountNotActivatedError: "Your account is not activated. A new link to activate your account has been emailed to your email address.",
            unknown: "An error happend, please try later."
        };

        try {
            console.log(`before login`);
            const r = await login_user(login_data);
            console.log(`login: ${r}`);

            switch (r) {
                case 1:
                    console.log("[route-login.js] Invalid email error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.notValidEmailError
                    });
                    break;
                case 2:
                    console.log("[route-login.js] Password length error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.passwordLengthError
                    });
                    break;
                case 3:
                    console.log("[route-login.js] Nonexistent user error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.nonExistentUserError
                    });
                    break;
                case 4:
                    console.log("[route-login.js] Invalid password error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.invalidPasswordError
                    });
                    break;
                case 5:
                    console.log("[route-login.js] Paseto error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.pasetoError
                    });
                    break;
                case 6:
                    console.log("[route-login.js] Mongodb document update error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.documentUpdateError
                    });
                    break;
                case 7:
                    console.log("[route-login.js] Postmark error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.postmarkError
                    });
                    break;
                case 8:
                    console.log("[route-login.js] Account not activated error.".error);
                    res.render("connection-register/login", {
                        message: login_error_codes.accountNotActivatedError
                    });
                    break;
                case true:
                    // Initialize session
                    let sess = req.session;
                    sess.loggedin = true;
                    sess.email = login_data.email;
                    res.redirect("/d/dashboard");
                    break;
                default:
                    console.log("[route-login.js] Unknown error? (Check mongodb uri).".error.stack);
                    res.render("connection-register/login", {
                        message: login_error_codes.unknown
                    });
                    break;
            }

        } catch (err) {
            console.error(`[route-login.js] Error: ${err.stack}`.error)
            res.render("connection-register/login", {
                message: login_error_codes.unknown
            });
        }

    }
});
exports.routeLogin = router;