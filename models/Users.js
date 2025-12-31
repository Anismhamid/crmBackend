const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		profile: {
			firstName: {type: String, required: true},
			lastName: {type: String, required: true},
			avatar: {
				url: {type: String},
				alt: {type: String},
			},
			phone: {type: String, required: true, unique: true},
			position: {type: String},
			address: {
				type: {
					city: {type: String, required: true},
					street: {type: String},
					houseNo: {type: String},
					zipCode: {type: String, required: true},
				},
			},
			role: {
				type: String,
				enum: ["Admin", "customer", "customer_support", "seller"],
				required: true,
			},
			isActive: {
				type: Boolean,
				default: true,
			},
		},
		// permissions: {enum: ["Admin","customer","customer"]}, // Manage users permissions
		lastLogin: {type: Date},
	},
	{timestamps: true},
);

module.exports = mongoose.model("Users", UserSchema);
