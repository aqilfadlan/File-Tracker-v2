const { db2 } = require("../db"); // infraci_sharedb connection

exports.getAllUsers = async (req, res) => {
  try {
    const [results] = await db2.query(`
      SELECT 
        u.user_id,
        u.usr_name,
        u.usr_email,
        l.userlevelname AS role,
        d.department AS department,
        r.rgo_name AS area_office
      FROM users u
      LEFT JOIN userlevels l ON u.userlevel = l.userlevelid
      LEFT JOIN tref_department d ON u.usr_dept = d.department_id
      LEFT JOIN tref_rgo r ON u.usr_areaoffice = r.rgo_id
      ORDER BY u.user_id ASC
    `);

    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};



exports.getMe = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json(req.session.user);
};

