// models/dossier.model.js
module.exports = (sequelize, DataTypes) => {
  const Dossier = sequelize.define('Dossier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dateCreation: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    statut: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en_cours'
    }
  }, {
    tableName: 'dossiers',
    timestamps: true
  });

  // Exemple d’association (facultative)
  Dossier.associate = (models) => {
    Dossier.belongsTo(models.Student, {
      foreignKey: 'studentId',
      as: 'etudiant'
    });
  };

  return Dossier;
};
