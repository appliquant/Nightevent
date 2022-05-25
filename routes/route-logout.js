const express = require("express");
const router = express.Router();

// Dashboard
router.all("/logout", (req, res) => {
    if (req.session.loggedin) {
        const usremail = req.session.email;
        req.session.destroy((err) => {
            if (err) {
                console.log(`(route-logout.js) Error at session.destroy(): ${err.stack}`);
            } else {
                res.redirect('/login');
                console.log(`User ${usremail} logged out.`);
            }

        });
    } else {
        res.redirect('/login');
    }
});

exports.logout = router;