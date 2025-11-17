const express = require("express");
const router = express.Router();
const fileMovementController = require("../controllers/fileMovementController");

router.post("/", fileMovementController.createFileMovement);
router.get("/", fileMovementController.getFileMovements);
router.get("/:move_id", fileMovementController.getFileMovementById);
router.put("/:move_id", fileMovementController.updateFileMovement);
router.delete("/:move_id", fileMovementController.deleteFileMovement);

module.exports = router;
