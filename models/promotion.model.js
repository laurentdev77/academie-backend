// models/promotion.model.js
module.exports = (sequelize, DataTypes) => {
  const Promotion = sequelize.define(
    "Promotion",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nom: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      annee: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // filiereId ajouté ; nullable pour compatibilité initiale
      filiereId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Référence facultative vers la filière",
      },
    },
    {
      tableName: "promotions",
      timestamps: true,
    }
  );

  Promotion.associate = (models) => {
    Promotion.hasMany(models.Student, {
      foreignKey: "promotionId",
      as: "students",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Promotion.hasMany(models.Module, {
      foreignKey: "promotionId",
      as: "modules",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    Promotion.belongsTo(models.Filiere, {
      foreignKey: "filiereId",
      as: "filiere",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  };

  
  return Promotion;
};
