module.exports = (sequelize, DataTypes) => {
  const Seance = sequelize.define(
    "Seance",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      moduleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      teacherId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      titre: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      heureDebut: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: "08:00:00",
      },
      heureFin: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: "10:00:00",
      }
    },
    {
      tableName: "seances",
      timestamps: true,
    }
  );

  Seance.associate = (models) => {
    Seance.belongsTo(models.Module, { foreignKey: "moduleId", as: "module" });
    Seance.belongsTo(models.Teacher, { foreignKey: "teacherId", as: "teacher" });
    Seance.hasMany(models.Presence, { foreignKey: "seanceId", as: "presences" });
  };

  return Seance;
};
