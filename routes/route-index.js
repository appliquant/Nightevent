const express = require("express");
const router = express.Router();

const { addToEmailList } = require("../controllers/index-process/addToEmailList");

// Index
router.get("/", (req, res) => {
    res.render("index", {
        message: null
    });
});

// Add email to mail list
router.post("/", async (req, res) => {

    const index_error_codes = {
        unknown: "An error happend, try later.",
        success: "Thank you! Your submission has been received!"
    };

    try {
        const add = await addToEmailList();

        switch (add) {
            case 1:
                res.render("index", {
                    message: index_error_codes.success
                });
                break;
        
            default:
                res.render("index", {
                    message: index_error_codes.unknown
                });
                break;
        }
        
    } catch (err) {
        console.error(`[route-index.js] Error: ${err.stack}`);
        res.render("index", {
            message: index_error_codes.unknown
        });
    }
});

exports.routeIndex = router;