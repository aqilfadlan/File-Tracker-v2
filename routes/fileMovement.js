// routes/fileMovement.js
const express = require("express");
const router = express.Router();
const fileMovementController = require("../controllers/fileMovementController");

router.put("/:move_id/Approved", fileMovementController.approveMovement);


// ====================================
// 📌 GET ROUTES (specific first, general last)
// ====================================

// Check for duplicate requests (MUST be before /:move_id)
router.get("/check-duplicate", fileMovementController.checkDuplicateRequest);

// Get folders by department
router.get("/folders-by-department", fileMovementController.getFoldersByDepartment);

// Get pending movements
router.get("/pending", fileMovementController.getPendingMovements);

// Get my requests (logged-in user's requests)
router.get("/my-requests", fileMovementController.getMyRequests);

// Get my notifications
router.get("/my-notifications", fileMovementController.getMyNotifications);


// Get specific movement by ID
// -------------------------------
// Department-related routes
// -------------------------------
router.get("/files/my-department", fileMovementController.getFilesByDepartment);
router.get("/folders-by-department", fileMovementController.getFoldersByDepartment);

// -------------------------------
// Movement-specific routes
// -------------------------------
// Pending movements
router.get("/pending", fileMovementController.getPendingMovements);

// Create new movement
router.post("/", fileMovementController.createFileMovement);

// Special actions (approve, reject, take, return) MUST come BEFORE generic :move_id
router.put("/approve/:move_id", fileMovementController.approveMovement);
router.put("/reject/:move_id", fileMovementController.rejectMovement);
router.put("/take/:move_id", fileMovementController.takeOutFile);
router.put("/return/:move_id", fileMovementController.returnFile);

// -------------------------------
// Generic CRUD routes for a specific moveme
// -------------------------------
router.get("/", fileMovementController.getFileMovements);
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