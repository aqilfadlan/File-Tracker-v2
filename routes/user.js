// routes/user.js
const express = require("express");
const router = express.Router();
const { getAllUsers, getMe } = require("../controllers/userController");

router.get("/", getAllUsers);
router.get("/me", getMe);

module.exports = router;
