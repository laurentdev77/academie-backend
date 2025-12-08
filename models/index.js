"use strict";
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
require("dotenv").config();

const basename = path.basename(__filename);
const db = {};

let sequelize;

// ===============================
// 🔥 RENDER : Utilise DATABASE_URL
// ===============================
if (process.env.DATABASE_URL) {
  console.log("🔗 Using Render PostgreSQL (DATABASE_URL)");

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

// ===============================
// 💻 LOCAL : Utilise .env standards
// ===============================
} else {
  console.log("💻 Using local PostgreSQL");

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST || "127.0.0.1",
      port: process.env.DB_PORT || 5432,
      dialect: process.env.DB_DIALECT || "postgres",
      logging: false,
    }
  );
}

// 🔍 Charger dynamiquement tous les modèles
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const modelPath = path.join(__dirname, file);
    const modelFactory = require(modelPath);

    if (typeof modelFactory === "function") {
      const model = modelFactory(sequelize, Sequelize.DataTypes);
      if (model && model.name) {
        db[model.name] = model;
        console.log(`✅ Modèle chargé : ${model.name}`);
      } else {
        console.warn(`⚠️  Modèle invalide dans ${file}`);
      }
    } else {
      console.warn(`⚠️  ${file} ignoré : n’exporte pas une fonction Sequelize`);
    }
  });

// 🔗 Appliquer les associations
Object.keys(db).forEach((modelName) => {
  if (
    db[modelName].associate &&
    typeof db[modelName].associate === "function"
  ) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
