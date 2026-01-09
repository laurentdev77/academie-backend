// models/module.model.js
module.exports = (sequelize, DataTypes) => {
  const Module = sequelize.define(
    "Module",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      credits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      coefficient: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1.0,
      },
      isOptional: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      teacherId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      promotionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      filiereId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "modules",
      timestamps: true,
    }
  );

  /** 🔥 Toutes les associations regroupées ici */
  Module.associate = (models) => {
    Module.belongsTo(models.Promotion, {
      foreignKey: "promotionId",
      as: "promotion",
    });

    Module.belongsTo(models.Filiere, {
      foreignKey: "filiereId",
      as: "filiere",
    });

    Module.belongsTo(models.User, {
      foreignKey: "teacherId",
      as: "teacher",
    });

    Module.hasMany(models.Note, {
      foreignKey: "moduleId",
      as: "notes",
    });

    Module.hasMany(models.Resource, {
      foreignKey: "moduleId",
      as: "resources",
    });

    Module.associate = (models) => {
  Module.belongsTo(models.Teacher, { as: "teacher", foreignKey: "teacherId" });
  Module.belongsTo(models.Promotion, { as: "promotion", foreignKey: "promotionId" });
  Module.hasMany(models.Resource, { as: "resources", foreignKey: "moduleId" });
};

    // ✅ Déplacés ici : SEANCE + PRESENCE
    Module.hasMany(models.Seance, {
      foreignKey: "moduleId",
      as: "seances",
      onDelete: "CASCADE",
    });

    Module.hasMany(models.Presence, {
      foreignKey: "moduleId",
      as: "presences",
      onDelete: "CASCADE",
    });
  };

  return Module;
};