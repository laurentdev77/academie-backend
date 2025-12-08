const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./models');
const path = require("path");

dotenv.config();

const app = express();

// CORS: front-end exact + cookies
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// 🔥 Fix ultra-minimal pour permettre les cookies JWT (NE CASSE RIEN)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test DB connection
db.sequelize.authenticate()
  .then(() => console.log('✅ DB connecté avec succès'))
  .catch(err => console.error('❌ Impossible de se connecter à la DB:', err));

// Synchronisation des modèles
db.sequelize.sync({ alter: false })
  .then(() => console.log('✅ Modèles synchronisés'))
  .catch(err => console.error('❌ Erreur synchronisation:', err));

// ----------------- ROUTES -----------------
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/roles', require('./routes/role.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/promotions', require('./routes/promotion.routes'));
app.use('/api/modules', require('./routes/module.routes'));
app.use('/api/resources', require('./routes/resource.routes'));
app.use('/api/bulletins', require('./routes/bulletin.routes'));
app.use('/api/notes', require('./routes/note.routes'));
app.use('/api/filieres', require('./routes/filiere.routes'));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", require("./routes/upload.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/teachers", require("./routes/teacher.routes"));
app.use("/api/schedules", require("./routes/schedule.routes"));
app.use("/api/presence", require("./routes/presence.routes"));

// Fix pour compatibilité Vite
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Route test
app.get('/', (req, res) => res.send('Backend académique opérationnel 🚀'));

// Middleware erreur 404
app.use((req, res) => res.status(404).json({ message: 'Route non trouvée' }));

// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Serveur en écoute sur le port ${PORT}`);
});
