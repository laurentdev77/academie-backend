// models/associations.js
module.exports = (db) => {
  const { User, Role, Student, Promotion, Module, Note, Resource } = db;

  if (!User || !Role) {
    console.error("⚠️  Les modèles User ou Role ne sont pas encore chargés !");
    return;
  }

  // -----------------------
  // 🔹 ROLES ↔ USERS
  // -----------------------
  Role.hasMany(User, {
    foreignKey: "roleId",
    as: "users",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
  User.belongsTo(Role, {
    foreignKey: "roleId",
    as: "role",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  // -----------------------
  // 🔹 USERS ↔ STUDENTS
  // -----------------------
  User.hasOne(Student, {
    foreignKey: "userId",
    as: "student",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
  Student.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // -----------------------
  // 🔹 PROMOTIONS ↔ STUDENTS
  // -----------------------
  Promotion.hasMany(Student, {
    foreignKey: "promotionId",
    as: "students",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
  Student.belongsTo(Promotion, {
    foreignKey: "promotionId",
    as: "promotion",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // -----------------------
  // 🔹 USERS (teacher) ↔ MODULES
  // -----------------------
  User.hasMany(Module, {
    foreignKey: "teacherId",
    as: "modules",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
  Module.belongsTo(User, {
    foreignKey: "teacherId",
    as: "teacher",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  // -----------------------
  // 🔹 MODULES ↔ NOTES
  // -----------------------
  Module.hasMany(Note, {
    foreignKey: "moduleId",
    as: "notes",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
  Note.belongsTo(Module, {
    foreignKey: "moduleId",
    as: "module",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // -----------------------
  // 🔹 STUDENTS ↔ NOTES
  // -----------------------
  Student.hasMany(Note, {
    foreignKey: "studentId",
    as: "notes",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
  Note.belongsTo(Student, {
    foreignKey: "studentId",
    as: "student",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // -----------------------
  // 🔹 MODULES ↔ RESOURCES
  // -----------------------
  if (Resource) {
    Module.hasMany(Resource, {
      foreignKey: "moduleId",
      as: "resources",
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    Resource.belongsTo(Module, {
      foreignKey: "moduleId",
      as: "module",
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  }

  console.log("✅ Associations entre modèles appliquées avec succès !");
};
