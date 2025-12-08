// models/noteHistory.model.js
module.exports = (sequelize, DataTypes) => {
  const NoteHistory = sequelize.define(
    "NoteHistory",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      noteId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      previousValeur: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      newValeur: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      previousSession: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      newSession: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      changedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "note_histories",
      timestamps: true,
      paranoid: false,
    }
  );

  NoteHistory.associate = (models) => {
    NoteHistory.belongsTo(models.Note, { foreignKey: "noteId", as: "note" });
    NoteHistory.belongsTo(models.User, { foreignKey: "changedBy", as: "changer" });
  };

  return NoteHistory;
};
