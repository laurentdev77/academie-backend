const permit = (...allowedRoles) => {
  return (req, res, next) => {
    const roleName = req.user?.role?.name; // alias corrigé
    if (!roleName) return res.status(403).json({ message: 'Rôle non défini' });
    if (allowedRoles.includes(roleName)) return next();
    return res.status(403).json({ message: 'Accès interdit' });
  };
};

module.exports = { permit };
