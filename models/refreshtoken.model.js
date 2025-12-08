module.exports = (sequelize, DataTypes) => {
  return sequelize.define('RefreshToken', {
    token: { type: DataTypes.STRING, primaryKey: true },
    expiryDate: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'refresh_tokens', timestamps: false });
};
