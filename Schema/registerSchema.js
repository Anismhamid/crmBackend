const joi = require("joi");

const registerSchema = joi.object({
	email: joi.string().email().required(),
	password: joi.string().min(8).required(),
	profile: joi
		.object({
			firstName: joi.string().required(),
			lastName: joi.string().required(),
			avatar: joi
				.object({
					url: joi.string().allow(""),
					alt: joi.string().allow(""),
				})
				.optional(),
			phone: joi
				.string()
				.pattern(/^(\+972|0)?5\d{8}$/)
				.required(),
			position: joi
				.string()
				.valid("manager", "staff", "support")
				.optional()
				.allow(""),
			address: joi
				.object({
					city: joi.string().required(),
					street: joi.string().required(),
					houseNo: joi.string().allow(""),
					zipCode: joi.string().allow(""),
				})
				,
			role: joi
				.string()
				.valid("admin", "customer", "customer_support", "seller")
				.required(),
		})
		.required(),
});

module.exports = registerSchema;
