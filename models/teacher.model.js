// models/teacher.model.js
module.exports = (sequelize, DataTypes) => {
  const Teacher = sequelize.define(
    "Teacher",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      prenom: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      grade: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Grade académique ou militaire",
      },
      specialite: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Lien vers le compte utilisateur s’il existe",
      },
    },
    {
      tableName: "teachers",
      timestamps: true,
    }
  );

  Teacher.associate = (models) => {
    // 🔸 Un enseignant peut enseigner plusieurs modules
    Teacher.hasMany(models.Module, {
      foreignKey: "teacherId",
      as: "modules",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    Teacher.associate = (models) => {
  Teacher.hasMany(models.Module, { as: "modules", foreignKey: "teacherId" });
};

    // 🔸 Lien facultatif vers un utilisateur (compte)
    Teacher.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  };

  return Teacher;
};
