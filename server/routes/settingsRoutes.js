const express = require("express");
const { getPublicSettings } = require("../controllers/settingController");

// public storefront-facing settings; PATCH comes from the admin API instead
const router = express.Router();

router.get("/", getPublicSettings);

module.exports = router;
