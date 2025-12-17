if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "12h",
};
