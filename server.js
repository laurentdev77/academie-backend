const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./models");
const path = require("path");

dotenv.config();

const app = express();

/* ================================
   ✅ CORS (DEV + PROD)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "https://academie-frontend.onrender.com",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
}));

/* ================================
   BODY PARSERS
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
   DATABASE
================================ */
db.sequelize.authenticate()
  .then(() => console.log("✅ DB connectée"))
  .catch(err => console.error("❌ DB erreur :", err));

db.sequelize.sync({ alter: false })
  .then(() => console.log("✅ Modèles synchronisés"))
  .catch(err => console.error("❌ Sync erreur :", err));

/* ================================
   ROUTES API
================================ */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/roles", require("./routes/role.routes"));
app.use("/api/students", require("./routes/student.routes"));
app.use("/api/promotions", require("./routes/promotion.routes"));
app.use("/api/modules", require("./routes/module.routes"));
app.use("/api/resources", require("./routes/resource.routes"));
app.use("/api/bulletins", require("./routes/bulletin.routes"));
app.use("/api/notes", require("./routes/note.routes"));
app.use("/api/filieres", require("./routes/filiere.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/teachers", require("./routes/teacher.routes"));
app.use("/api/schedules", require("./routes/schedule.routes"));
app.use("/api/presence", require("./routes/presence.routes"));

/* ================================
   STATIC FILES
================================ */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

/* ================================
   ROOT
================================ */
app.get("/", (req, res) => {
  res.send("Backend académique opérationnel 🚀");
});

/* ================================
   404
================================ */
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée" });
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
