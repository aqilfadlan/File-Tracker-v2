const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");

router.get("/", departmentController.getAllDepartments);
router.get("/:id", departmentController.getDepartmentById);
router.post("/", departmentController.createDepartment);
router.put("/:id", departmentController.updateDepartment);
router.delete("/:id", departmentController.deleteDepartment);

module.exports = router;
exports.getAllDepartments = (req, res) => {
  console.log("🔥 getAllDepartments hit");

  db2.query(
    "SELECT department_id, department FROM tref_department",
    (err, results) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    }
  );
};
