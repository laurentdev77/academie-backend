const db = require("./models");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    await db.sequelize.authenticate();
    console.log("✅ DB connectée");

    // 🔹 ADMIN
    const adminRole = await db.Role.findOne({ where: { name: "nzeba" } });

    const [admin, adminCreated] = await db.User.findOrCreate({
      where: { username: "nzeba" },
      defaults: {
        email: "nzeba@test.com", // change si besoin
        password: await bcrypt.hash("123456", 10),
        roleId: adminRole.id,
        status: "active",
      },
    });

    console.log(adminCreated ? "✅ Admin créé" : "ℹ️ Admin déjà existant");

    console.log("🎯 Seed terminé avec succès !");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur seed DB :", err);
    process.exit(1);
  }
}

seed();
