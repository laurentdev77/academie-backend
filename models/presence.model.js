// models/presence.model.js
module.exports = (sequelize, DataTypes) => {
  const Presence = sequelize.define(
    "Presence",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      studentId: DataTypes.UUID,
      moduleId: DataTypes.UUID,
      teacherId: DataTypes.UUID,

      seanceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      statut: DataTypes.STRING(20),
      motif: DataTypes.TEXT,
    },
    {
      tableName: "presences",
      timestamps: true,
    }
  );

  Presence.associate = (models) => {
    Presence.belongsTo(models.Student, { foreignKey: "studentId", as: "student" });
    Presence.belongsTo(models.Module, { foreignKey: "moduleId", as: "module" });
    Presence.belongsTo(models.Teacher, { foreignKey: "teacherId", as: "teacher" });
    Presence.belongsTo(models.Seance, { foreignKey: "seanceId", as: "seance" });
  };

  return Presence;
};
