// backend/scripts/createAdmin.js
const bcrypt = require('bcryptjs');
const db = require('../models');

(async () => {
  try {
    // Vérifier que le rôle "admin" existe
    let adminRole = await db.Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = await db.Role.create({ name: 'admin' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.User.findOne({ where: { email: 'nzeba@test.com' } });
    if (existingUser) {
      console.log("⚠️ Un utilisateur avec cet email existe déjà.");
      process.exit(0);
    }

    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await db.User.create({
      username: 'jeannettenzeba',
      email: 'nzeba@test.com',
      password: hashedPassword,
      status: 'active',
      roleId: adminRole.id
    });

    console.log('✅ Admin créé avec succès :', user.email);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l’admin:', error);
    process.exit(1);
  }
})();
