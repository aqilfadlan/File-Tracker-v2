const express = require("express");
const router = express.Router();
const fileMovementController = require("../controllers/fileMovementController");

// -------------------------------------
// APPROVE (two versions kept exactly as you had)
// -------------------------------------
router.put("/:move_id/Approved", fileMovementController.approveMovement);
router.put("/approve/:move_id", fileMovementController.approveMovement);

// -------------------------------------
// GET ROUTES
// -------------------------------------
router.get("/folders-by-department", fileMovementController.getFoldersByDepartment);
router.get("/files/my-department", fileMovementController.getFilesByDepartment);
router.get("/pending", fileMovementController.getPendingMovements);

// Get all movements
router.get("/", fileMovementController.getFileMovements);

// Get movement by ID
router.get("/:move_id", fileMovementController.getFileMovementById);

// -------------------------------------
// ACTION ROUTES
// -------------------------------------
router.put("/reject/:move_id", fileMovementController.rejectMovement);

// Two versions kept (same as you had)
router.put("/take/:move_id", fileMovementController.takeOutFile);
router.put("/:move_id/take-out", fileMovementController.takeOutFile);

// Two versions kept (same as you had)
router.put("/:move_id/return", fileMovementController.returnFile);

// -------------------------------------
// CRUD
// -------------------------------------
router.post("/", fileMovementController.createFileMovement);
router.put("/:move_id", fileMovementController.updateFileMovement);
router.delete("/:move_id", fileMovementController.deleteFileMovement);

module.exports = router;