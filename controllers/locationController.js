const { db1 } = require("../db");

// ✅ CREATE LOCATION
exports.createLocation = async (req, res) => {
  console.log("📍 Incoming body:", req.body);
  console.log("👤 Session user:", req.session.user);

  const { location_name } = req.body;
  const sessionUser = req.session.user;

  if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
  if (!location_name) return res.status(400).json({ error: "Location name is required" });

  try {
    const [result] = await db1.query(
      `INSERT INTO locations (location_name) VALUES (?)`,
      [location_name]
    );

    console.log("✅ Inserted location:", result);

    res.json({
      success: true,
      location_id: result.insertId,
      location_name,
    });
  } catch (err) {
    console.error("❌ POST /api/locations error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// ✅ GET ALL LOCATIONS
exports.getLocations = async (req, res) => {
  try {
    const [rows] = await db1.query(`
      SELECT location_id, location_name
      FROM locations
      ORDER BY location_id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ GET /api/locations error:", err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
};

// ✅ GET LOCATION BY ID
exports.getLocationById = async (req, res) => {
  const { location_id } = req.params;
  try {
    const [rows] = await db1.query(
      `SELECT location_id, location_name FROM locations WHERE location_id = ?`,
      [location_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Location not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ GET /api/locations/:id error:", err);
    res.status(500).json({ error: "Failed to fetch location" });
  }
};

// ✅ UPDATE LOCATION
exports.updateLocation = async (req, res) => {
  const { location_id } = req.params;
  const { location_name } = req.body;

  try {
    const [result] = await db1.query(
      `UPDATE locations SET location_name = ? WHERE location_id = ?`,
      [location_name, location_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Location not found" });

    res.json({ success: true, message: "Location updated successfully" });
  } catch (err) {
    console.error("❌ PUT /api/locations/:id error:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
};

// ✅ DELETE LOCATION
exports.deleteLocation = async (req, res) => {
  const { location_id } = req.params;
  try {
    const [result] = await db1.query("DELETE FROM locations WHERE location_id = ?", [location_id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Location not found" });

    res.json({ success: true, message: "Location deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/locations/:id error:", err);
    res.status(500).json({ error: "Failed to delete location" });
  }
};
