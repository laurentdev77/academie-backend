// models/role.model.js
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "roles", // ✅ correspond à ta table en base
      timestamps: false,  // tu peux remettre true si tu as des colonnes createdAt/updatedAt
    }
  );

  Role.associate = (models) => {
    Role.hasMany(models.User, {
      foreignKey: "roleId",
      as: "users",
    });
  };

  return Role;
};
