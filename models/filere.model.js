// models/filiere.model.js
module.exports = (sequelize, DataTypes) => {
  const Filiere = sequelize.define(
    "Filiere",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: "Le nom de la filière est requis" },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "filieres",
      timestamps: true,
    }
  );

  Filiere.associate = (models) => {
    Filiere.hasMany(models.Promotion, {
      foreignKey: "filiereId",
      as: "promotions",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  };

  return Filiere;
};
