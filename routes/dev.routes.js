const express = require("express");
const router = express.Router();
const db = require("../models");

router.post("/seed-roles", async (req, res) => {
  try {
    const roles = ["student", "teacher", "secretary", "DE", "admin"];

    const created = [];

    for (const name of roles) {
      const [role, isCreated] = await db.Role.findOrCreate({
        where: { name },
      });
      if (isCreated) created.push(name);
    }

    return res.json({
      message: "Roles seedés",
      created,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
