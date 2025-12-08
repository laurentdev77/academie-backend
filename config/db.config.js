module.exports = {
  HOST: "localhost",
  USER: "postgres",       // <-- nom de ton utilisateur PostgreSQL
  PASSWORD: "tonMotDePasse", 
  DB: "tracabilite",      // nom exact de ta base
  dialect: "postgres",
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
};
