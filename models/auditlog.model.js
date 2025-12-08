module.exports = (sequelize, DataTypes) => {
  return sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID },
    actionType: { type: DataTypes.STRING, allowNull: false },
    targetType: { type: DataTypes.STRING },
    targetId: { type: DataTypes.STRING },
    payload: { type: DataTypes.JSONB },
    ip: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { tableName: 'audit_logs', timestamps: false });
};
