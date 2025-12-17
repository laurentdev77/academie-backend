const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined`);
  }
});

module.exports = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD,
  DB: process.env.DB_NAME,
  PORT: Number(process.env.DB_PORT) || 5432,
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
