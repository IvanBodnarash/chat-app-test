export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};
