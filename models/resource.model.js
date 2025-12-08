// models/resource.model.js
module.exports = (sequelize, DataTypes) => {
  const Resource = sequelize.define(
    "Resource",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("video", "pdf", "document", "other"),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT, // ✅ ajouté pour permettre des textes longs
        allowNull: true,
      },
      moduleId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: "resources",
      timestamps: true,
    }
  );

  Resource.associate = (models) => {
    Resource.belongsTo(models.Module, {
      foreignKey: "moduleId",
      as: "module",
    });
    Resource.belongsTo(models.User, {
      foreignKey: "uploadedBy",
      as: "uploader",
    });
  };

  return Resource;
};
