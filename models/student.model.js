// backend/models/student.model.js
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
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: "Le matricule est requis" },
        },
        comment: "Code unique d'identification académique de l'étudiant",
      },
      nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: "Le nom est requis" } },
      },
      prenom: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      sexe: {
        type: DataTypes.ENUM("M", "F", "Autre"),
        allowNull: true,
        comment: "Sexe de l'étudiant",
      },
      dateNaissance: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Date de naissance de l'étudiant",
      },
      lieuNaissance: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Lieu de naissance de l'étudiant",
      },
      grade: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Grade académique ou militaire de l'étudiant",
      },
      etatDossier: {
        type: DataTypes.ENUM("en_cours", "complet", "incomplet"),
        allowNull: false,
        defaultValue: "en_cours",
        comment: "Statut administratif du dossier étudiant",
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Référence vers le compte utilisateur (User)",
      },
      promotionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Référence vers la promotion ou niveau",
      },
      photoUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Photo de profil de l'étudiant (facultatif)",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "students",
      timestamps: true,
      paranoid: true,
      deletedAt: "deletedAt",
      indexes: [
        { fields: ["matricule"], unique: true },
        { fields: ["promotionId"] },
      ],
    }
  );

  /* ==========================================================
     🔗 ASSOCIATIONS
     ========================================================== */
  Student.associate = (models) => {
    // 🔸 Un étudiant appartient à un utilisateur (compte)
    Student.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // 🔸 Un étudiant appartient à une promotion
    Student.belongsTo(models.Promotion, {
      foreignKey: "promotionId",
      as: "promotion",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // 🔸 Un étudiant possède plusieurs notes
    Student.hasMany(models.Note, {
      foreignKey: "studentId",
      as: "notes",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // 🔸 🔥 AJOUT MANQUANT (corrige ton erreur)
    Student.hasMany(models.Presence, {
      foreignKey: "studentId",
      as: "presences",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Student;
};
