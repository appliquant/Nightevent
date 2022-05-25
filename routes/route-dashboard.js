const express = require("express");
const router = express.Router();

// Dashboard
router.get("/d/dashboard", (req, res) => {
    const sess = req.session;
    const name = sess.email;

    if (sess.loggedin) {
    res.render('dashboard/dashboard', {
        message: name
    }); } else {
        res.redirect("/login");
    }
});

// Dashboard - Create
router.get("/d/create", (req, res) => {
    const sess = req.session;
    const name = sess.email;

    if (sess.loggedin) {
    res.render('dashboard/dashboard', {
        message: name
    }); } else {
        res.redirect("/login");
    }
});

exports.routeDashboard = router;