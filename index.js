require('dotenv').config();
const express = require('express');
const path = require("path");
const bodyParser = require("body-parser");
const colors = require('colors');
const session = require("express-session");
// const { v4: uuidv4 } = require('uuid');
// const FileStore = require('session-file-store')(session);

// Routes
const { routeIndex } = require("./routes/route-index");
const { routeLogin } = require("./routes/route-login"); 
const { routeRegister } = require("./routes/route-register");
const { routeRegistationToken } = require("./routes/route-validate-token");

const { routeDashboard } = require("./routes/route-dashboard");
const { logout } = require("./routes/route-logout");

const { routeRecover } = require("./routes/route-recover");


// Colors theme (from nodejs.org)
colors.setTheme({
    success: 'bgBlue',
    // error: 'bgRed',
    error: 'red',
    warn: 'yellow',

    sysinfo: 'bgGreen',
    info: 'green'
});

// Init app
const app = express();

// Static Files
app.use(express.static('public'));

// View engine & views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser
app.use(bodyParser.urlencoded({
    extended: true
}));

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#Secure_and_HttpOnly_cookies
// Session arguments
let expressSessionArgs = {};
if (process.env.STATE === "dev"){
     expressSessionArgs = { 
        // secret: 'keyboard cat',
        // cookie: { maxAge: 60000 },
        // saveUninitialized: false,
        // resave: false,
        // store: new FileStore()
            // secret: 'keyboard cat',
            // resave: true,
            // saveUninitialized: true,
            cookie: {
                httpOnly: false,
                secure: false,
                maxAge: 1000 * 60 * 60,
            },
            name : 'app.sid',
            secret: "1234567890QWERTY",
            resave: true,
            // store: new MemoryStore(),
            saveUninitialized: true

        // secret: process.env.EXPRESS_SESSION_SECRET_DEV,
        // genid: () => {
        //     return uuidv4() // use UUIDs for session IDs
        //    },
        // name: "dev_cookie",
        // // store: redis, // en prod
        // store: new FileStore(),
        // cookie: {
        //     // domain=nightevent.me - dans prod
        //     httpOnly: true,
        //     secure: false, // true en prod
        //     sameSite: "lax",
        //     maxAge: 60000, // 1 heures
        //     path: "/",
        //     secure: false //  true en prod,
        //     // app.set('trust proxy', 1) si deriere proxy ex:(Nginx)
        // },
        // resave: false, // false en prod pour obliger a enregister dans session store (redis)
        // rolling: true,
        // saveUninitialized: false
    };
} else {
    // Set to "prod"
    expressSessionArgs = {};
}   

// Session
app.use(session(expressSessionArgs));

// Router (routes)
app.use(routeIndex);
app.use(routeLogin);
app.use(routeRegister);
// /d/dashboard
app.use(routeDashboard);
app.use(logout);

// xx.xx/1/ - activate account verifiction 
app.use(routeRegistationToken);
// xx.xx/2/ - recover password verification
app.use(routeRecover);

// Port
const PORT = process.env.PORT || 3000;

// Testing route
// app.get("/test", (req, res) =>{
//     // const sess = req.session;
//     // sess.hello = true;
//     console.log(req.session);
//     res.send(`Session: ${req.session}`);
// });

// Port listening
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});

// 404 error
app.use((req, res, next) => {
    const page = req.originalUrl;
    res.render("404-error", {
        message: `The page ${page} doesn't exists!`
    });
});

// // 500+ error
// app.use(function (err, req, res, next) {
//     console.error(err.stack)
//     res.status(500).send('Error 500. Something broke.')
// })