// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./models");
const path = require("path");
const fs = require("fs");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin");

dotenv.config();

const app = express();

/* ================================
   CORS (DEV + PROD)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "https://academie-frontend.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/* ================================
   PARSERS
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================================
   LOGGER REQUÊTES
================================ */
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

/* ================================
   DB
================================ */
db.sequelize
  .authenticate()
  .then(() => console.log("✅ DB connecté"))
  .catch((err) => console.error("❌ DB error:", err));

db.sequelize
  .sync({ alter: false })
  .then(() => console.log("✅ Tables synchronisées"))
  .catch((err) => console.error("❌ Sync DB error:", err));

/* ================================
   UPLOADS (AVANT LES ROUTES)
================================ */
const uploadsDir = path.join(__dirname, "uploads");
const photosDir = path.join(uploadsDir, "photos");
const resourcesDir = path.join(uploadsDir, "resources");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log("📁 uploads créé");
}

if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
  console.log("📁 uploads/photos créé");
}

if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
  console.log("📁 uploads/resources créé");
}

/* ================================
   SERVIR LES UPLOADS
================================ */
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", express.static(uploadsDir));
app.use("/uploads/resources", express.static(resourcesDir));

/* ================================
   ROUTES API
================================ */
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
app.use("/api/auth", authRoutes);
app.use("/api/upload-photo", require("./routes/upload.routes"));
app.use("/api", adminRoutes);
/* ================================
   ROOT API
================================ */
app.get("/api", (req, res) => {
  res.send("Backend académique opérationnel 🚀");
});

/* ================================
   SERVIR LE FRONTEND (REACT BUILD)
================================ */
app.use(express.static(path.join(__dirname, "public")));

/* ================================
   FALLBACK REACT ROUTER (CRITIQUE)
================================ */
app.get('/', (req, res) => {
  res.json({ message: "API Academie Militaire en ligne 🚀" });
});

/* ================================
   404 API UNIQUEMENT
================================ */
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route API non trouvée" });
});

/* ================================
   MIDDLEWARE GLOBAL D'ERREUR
================================ */
app.use((err, req, res, next) => {
  console.error("💥 ERREUR BACKEND:", err);
  res.status(err.status || 500).json({
    message: err.message || "Erreur serveur",
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });
});

/* ================================
   LANCEMENT SERVEUR
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Serveur lancé sur le port ${PORT}`);
});
