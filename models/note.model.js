// backend/models/note.model.js
module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define(
    "Note",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      moduleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      session: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "Normale",
      },
      score: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: "Moyenne calculée (CE*0.4 + FE*0.6)",
        validate: {
          min: 0,
          max: 20,
        },
      },
      appreciation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          isIn: [[1, 2]],
        },
      },
      // CE and FE columns (nullable) — numeric-like
      ce: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 20,
        },
      },
      fe: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 20,
        },
      },
    },
    {
      tableName: "notes",
      timestamps: true,
      indexes: [
        { fields: ["studentId"] },
        { fields: ["moduleId"] },
        { fields: ["session"] },
        { fields: ["semester"] },
      ],
    }
  );

  Note.associate = (models) => {
    Note.belongsTo(models.Student, {
      foreignKey: "studentId",
      as: "student",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Note.belongsTo(models.Module, {
      foreignKey: "moduleId",
      as: "module",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  // Hook to compute score before save/update if ce or fe provided
  Note.beforeCreate((note) => {
    const ce = note.ce != null ? parseFloat(note.ce) : 0;
    const fe = note.fe != null ? parseFloat(note.fe) : 0;
    note.score = parseFloat(((ce * 0.4) + (fe * 0.6)).toFixed(2));
  });

  Note.beforeUpdate((note) => {
    const ce = note.ce != null ? parseFloat(note.ce) : 0;
    const fe = note.fe != null ? parseFloat(note.fe) : 0;
    note.score = parseFloat(((ce * 0.4) + (fe * 0.6)).toFixed(2));
  });

  return Note;
};
