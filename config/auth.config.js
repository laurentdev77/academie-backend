require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'secret_key',
  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h',       // durée du token d'accès
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'     // durée du token de rafraîchissement
};