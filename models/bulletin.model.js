// models/bulletin.model.js
module.exports = (sequelize, DataTypes) => {
  const Bulletin = sequelize.define('Bulletin', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    term: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    average: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'bulletins',
    timestamps: true,
  });

  Bulletin.associate = (models) => {
    Bulletin.belongsTo(models.User, { foreignKey: 'studentId', as: 'student' });
  
  };

  return Bulletin;
};
