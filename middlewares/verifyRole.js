const verifyRole = (roles = []) => {
	return (req, res, next) => {
		if (!req.user || !roles.includes(req.user.profile.role)) {
			return res.status(403).send("Access denied. Insufficient permissions.");
		}
		next();
	};
};

module.exports = verifyRole;
