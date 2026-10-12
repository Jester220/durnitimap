
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: "You do not have permission to do this" });
    }
    next();
  };
}

module.exports = requireRole;