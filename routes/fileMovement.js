const express = require("express");
const router = express.Router();
const fileMovementController = require("../controllers/fileMovementController");

router.put("/:move_id/Approved", fileMovementController.approveMovement);


// ====================================
// 📌 GET ROUTES (specific first, general last)
// ====================================

// Get folders by department
router.get("/folders-by-department", fileMovementController.getFoldersByDepartment);

// Get pending movements
router.get("/pending", fileMovementController.getPendingMovements);

// Get specific movement by ID
router.get("/:move_id", fileMovementController.getFileMovementById);

// Get ALL movements (THIS is what your frontend needs)
router.get("/", fileMovementController.getFileMovements);

// ====================================
// 📌 POST/PUT/DELETE ROUTES
// ====================================

// Create new movement
router.post("/", fileMovementController.createFileMovement);

// Update movement
router.put("/:move_id", fileMovementController.updateFileMovement);

// Delete movement
router.delete("/:move_id", fileMovementController.deleteFileMovement);

// Approve movement
router.put("/:move_id/Approved", fileMovementController.approveMovement);



// Reject movement
router.put("/:move_id/reject", fileMovementController.rejectMovement);

// Take out file
router.put("/:move_id/take-out", fileMovementController.takeOutFile);

// Return file
router.put("/:move_id/return", fileMovementController.returnFile);

module.exports = router;