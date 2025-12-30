const express = require("express");
const Users = require("../models/Users");
const bcryptJs = require("bcryptjs");
const registerSchema = require("../Schema/registerSchema");
const router = express.Router();
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const loginSchema = require("../Schema/loginSchema");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");

// GET /users
router.get("/", auth, verifyRole(["Admin"]), async (req, res) => {
	try {
		const users = await Users.find().select("-password");

		if (!users) {
			return res.status(404).send("User not found");
		}

		res.status(200).send(users);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

router.post("/register", async (req, res) => {
	try {
		// check schema errors
		const {error} = registerSchema.validate(req.body);

		if (error) return res.status(400).send(error.details[0].message);

		// destructure fields
		const {email, password, profile, role} = req.body;

		// check user exists
		let user = await Users.findOne({email: req.body.email});
		if (user)
			return res
				.status(400)
				.send("A user with this email already exists, Please Log in instead");

		// hash password
		const hashedPassword = bcryptJs.hashSync(password, 10);

		// create new user
		const newUser = new Users({email, password: hashedPassword, profile, role});
		// save user
		await newUser.save();
		// create token

		const payload = {
			_id: newUser._id,
			role: newUser.role,
			profile: newUser.profile,
		};

		const token = jwt.sign(payload, process.env.SECRET_JWT, {expiresIn: "7d"});

		res.status(201).send(token);
		// send result
	} catch (error) {
		res.status(500).send(error.message);
		console.log(req.body.password);
	}
});

router.post("/login", async (req, res) => {
	try {
		// check schema error
		const {error} = loginSchema.validate(req.body);
		if (error) return res.status(400).send(error.details[0].message);

		const {email, password} = req.body;

		// check if user exists
		const user = await Users.findOne({email});
		if (!user) return res.status(400).send("Email or password is incorrect");

		// check password
		const validPassword = bcryptJs.compareSync(password, user.password);
		if (!validPassword) return res.status(400).send("Email or password is incorrect");

		user.lastLogin = Date.now();
		await user.save();
		// create token
		const data = _.pick(user, ["_id", "role", "isActive", "lastlogin"]);
		data.profile = user.profile;
		const token = jwt.sign(data, process.env.SECRET_JWT);
		res.status(200).send(token);
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// GET /users/me
router.get("/me", auth, async (req, res) => {
	try {
		const userId = req.user._id;

		if (!userId) {
			return res.status(401).send("Invalid token");
		}

		const user = await Users.findById(userId).select("-password");

		if (!user) {
			return res.status(404).send("User not found");
		}

		res.status(200).send(user);
	} catch (error) {
		res.status(500).send("Server error");
	}
});

module.exports = router;
