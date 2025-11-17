const express = require("express");
const fileRoutes = require("./files");
const departmentRoutes = require("./departments");
const locationRoutes = require("./locations");
const authRoutes = require("./auth");
const takeoutRoutes = require("./takeout");
const folderRoutes = require("./folder");

const router = express.Router();

router.use("/files", fileRoutes);
router.use("/departments", departmentRoutes);
router.use("/locations", locationRoutes);
router.use("/", authRoutes); 
router.use("/takeout", takeoutRoutes);
router.use("/folder", folderRoutes);   

module.exports = router;