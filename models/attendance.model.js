module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    studentId: { type: DataTypes.UUID, allowNull: false },
    scheduleId: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false }
  });

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, { as: 'student', foreignKey: 'studentId' });
    Attendance.belongsTo(models.Schedule, { as: 'schedule', foreignKey: 'scheduleId' });
  };

  return Attendance;
};
