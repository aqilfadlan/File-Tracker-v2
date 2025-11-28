const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");

// Standalone folder view page
router.get("/folder/view/:folder_id", folderController.viewFolderPage);

module.exports = router;
