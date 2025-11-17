const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");

// Route definitions
router.get("/", fileController.getAllFiles);
router.get("/available-for-folder", fileController.getAvailableFilesForFolder);
router.post("/", fileController.createFile);
router.get("/:id", fileController.getFileById);
router.put("/:id", fileController.updateFile);
router.delete("/:id", fileController.deleteFile);
module.exports = router;
