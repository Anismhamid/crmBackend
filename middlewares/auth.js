const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
	const header = req.header("Authorization");
	if (!header) return res.status(401).send("Access denied, No token provided");
	try {
		const token = jwt.verify(header, process.env.SECRET_JWT);
		req.user = token;
		next();
	} catch (error) {
		res.status(401).send("Invalid token");
	}
};

module.exports = auth;
