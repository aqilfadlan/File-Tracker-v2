const { db2 } = require("../db");

// =========================
// GET all departments
// =========================
exports.getAllDepartments = async (req, res) => {
  try {
    const [results] = await db2.query(
      "SELECT department_id, department FROM tref_department ORDER BY department_id ASC"
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// GET department by ID
// =========================
exports.getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db2.query(
      "SELECT department_id, department FROM tref_department WHERE department_id = ?",
      [id]
    );

    if (results.length === 0)
      return res.status(404).json({ message: "Department not found" });

    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// CREATE new department
// =========================
exports.createDepartment = async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Department name is required" });

  try {
    const [result] = await db2.query(
      "INSERT INTO tref_department (department) VALUES (?)",
      [name]
    );

    res.status(201).json({
      message: "Department added successfully",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// UPDATE department
// =========================
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ error: "Department name is required" });

  try {
    const [result] = await db2.query(
      "UPDATE tref_department SET department = ? WHERE department_id = ?",
      [name, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Department not found" });

    res.json({ message: "Department updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// DELETE department
// =========================
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db2.query(
      "DELETE FROM tref_department WHERE department_id = ?",
      [id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Department not found" });

    res.json({ message: "Department deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
