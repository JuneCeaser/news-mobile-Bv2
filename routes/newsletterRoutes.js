const express = require("express");
const { getNewsletters } = require("../controllers/newsletterController");
const auth = require("../middleware/auth");

const router = express.Router();

// Routes
router.get("/", auth, getNewsletters);

module.exports = router;