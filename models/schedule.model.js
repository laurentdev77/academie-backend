// models/schedule.model.js
module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define(
    "Schedule",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      moduleId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      teacherId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      promotionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      room: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      start: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "Schedules",
      timestamps: true,
    }
  );

  Schedule.associate = (models) => {
    Schedule.belongsTo(models.Module, {
      foreignKey: "moduleId",
      as: "module",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    Schedule.belongsTo(models.Teacher, {
      foreignKey: "teacherId",
      as: "teacher",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });

    Schedule.belongsTo(models.Promotion, {
      foreignKey: "promotionId",
      as: "promotion",
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  };

  return Schedule;
};
