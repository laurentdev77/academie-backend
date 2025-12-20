module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    "Student",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      matricule: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      nom: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      prenom: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      sexe: {
        type: DataTypes.ENUM("M", "F"),
        allowNull: true, // 🔥 IMPORTANT
      },

      dateNaissance: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      lieuNaissance: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      grade: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      etatDossier: {
        type: DataTypes.ENUM("en_cours", "complet", "incomplet"),
        allowNull: false,
        defaultValue: "en_cours",
      },

      photoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      promotionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "Students",
      timestamps: true,
      paranoid: true, // soft delete
    }
  );

  Student.associate = (models) => {
    Student.belongsTo(models.Promotion, {
      foreignKey: "promotionId",
      as: "promotion",
    });

    Student.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Student;
};
