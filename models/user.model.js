// backend/models/user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      telephone: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: "Numéro de téléphone",
      },
      photoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Photo de profil (URL)",
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "inactive",
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      paranoid: true,
      deletedAt: "deletedAt",
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: "roleId", as: "role" });
    User.hasOne(models.Student, { foreignKey: "userId", as: "student" });
  };

  return User;
};
