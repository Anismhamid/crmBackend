const express = require("express");
const router = express.Router();
const {productSchema, updateProductNameSchema} = require("../Schema/productSchema");
const Products = require("../models/Products");
const auth = require("../middlewares/auth");
const verifyRole = require("../middlewares/verifyRole");
const Review = require("../models/Review");

//_____ Create and Get _____
// Create a new product
router.post("/", auth, verifyRole(["Admin"]), async (req, res) => {
	try {
		// validation schema
		const {error} = productSchema.validate(req.body);

		// Check shcema error
		if (error) return res.status(400).send(error.details[0].message);

		// Check if the product exists in the database
		const product = await Products.findOne({product_name: req.body.product_name});
		if (product) return res.status(400).send("This product already exists");

		// Create a new product
		const newProduct = new Products(req.body);

		// Save the product
		await newProduct.save();

		// Return successfully product created
		res.status(201).send("product added successfully");
	} catch (error) {
		res.status(500).send("internal server error");
	}
});
router.get("/search", async (req, res) => {
	try {
		const {
			category,
			isSale,
			inStock,
			manufacturer,
			minDiscount,
			minPrice = 1,
			maxPrice = 1000,
			sortBy = "newest",
			limit = 1000,
			skip = 0,
		} = req.query;

		const filter = {};

		// Text filters
		if (category && category !== "") filter.category = category;
		if (manufacturer && manufacturer.trim() !== "") {
			filter.manufacturer = manufacturer.trim();
		}

		// Boolean filters
		if (isSale === "true") filter["sales.isSale"] = true;
		if (inStock === "true") filter.quantity_in_stock = {$gt: 0};

		// Number filters
		if (minDiscount && minDiscount !== "0") {
			filter.discount = {$gte: Number(minDiscount)};
		}

		// Price filter
		if (minPrice !== undefined || maxPrice !== undefined) {
			filter.price = {};
			if (minPrice !== undefined && minPrice !== "0") {
				filter.price.$gte = Number(minPrice);
			}
			if (maxPrice !== undefined && maxPrice !== "1000") {
				filter.price.$lte = Number(maxPrice);
			}
		}


		// Sorting map
		const sortMap = {
			newest: {createdAt: -1},
			priceAsc: {price: 1},
			priceDesc: {price: -1},
		};

		const limitNumber = Number(limit);
		const skipNumber = Number(skip);

		const products = await Products.find(filter)
			.sort(sortMap[sortBy] || sortMap.newest)
			.skip(skipNumber)
			.limit(limitNumber);

		console.log(`Found ${products.length} products`); // Debug log

		res.json(products);
	} catch (err) {
		console.error("Search Products Error:", err);
		res.status(500).json({
			message: "Failed to fetch products",
			error: err.message,
		});
	}
});
// Fetch all products
router.get("/", async (req, res) => {
	try {
		// Try to find the products
		const products = await Products.find();

		// check if the proucts is exists
		if (!products.length) return res.status(404).send("No products has been found.");

		// Return the products
		res.status(200).send(products);
	} catch (error) {
		res.status(500).send("internal server error");
	}
});

// Fetch product by id
router.get("/:id", async (req, res) => {
	const {id} = req.params;
	try {
		const product = await Products.findById(id).populate({
			path: "reviews",
			populate: {
				path: "user",
				select: "profile.firstName profile.lastName avatar.url avatar.alt email",
			},
		});

		if (!product) return res.status(404).send("No products found");

		res.status(200).send(product);
	} catch (error) {
		res.status(500).send(error.message);
	}
});

router.get("/category/:category", async (req, res) => {
	const category = req.params.category.toLowerCase();

	try {
		const products = await Products.find({
			category: {$regex: new RegExp(`^${category}$`, "i")}, // case-insensitive
		});

		if (!products.length) return res.status(404).send("No products found");
		res.status(200).send(products);
	} catch (error) {
		console.log(error);
		res.status(500).send("internal server error");
	}
});

// delete product by id
router.delete("/:id", auth, verifyRole(["Admin"]), async (req, res) => {
	const {id} = req.params;
	try {
		// check if exists
		const product = await Products.findByIdAndDelete(id, {new: true});
		if (!product) return res.status(404).send("No products has been found");

		res.status(200).send("product has been deleted successfully");
	} catch (error) {
		res.status(500).send(error.message);
		// "internal server error";
	}
});

//_____ Updates _____

// update product by id
router.put("/:id", auth, verifyRole(["Admin"]), async (req, res) => {
	try {
		const {id} = req.params;
		const product = await Products.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true,
		});
		if (!product) return res.status(404).send("Product not found");
		res.status(200).send(product);
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// update spicific produc name by id
router.patch("/:id", auth, verifyRole(["Admin"]), async (req, res) => {
	try {
		const {id} = req.params;

		const {error} = updateProductNameSchema.validate(req.body);
		if (error) return res.status(400).send(error.details[0].message);

		const product = await Products.findOneAndUpdate(
			id,
			{product_name: req.body.product_name},
			{new: true},
		);
		if (!product) return res.status(400).send("product not found");
		res.status(200).send(product);
	} catch (error) {
		res.status(500).send(error.message);
	}
});

// router.get("/search", async (req, res) => {
// 	try {
// 		const {q, category} = req.query;
// 		const filter = {};

// 		if (q) {
// 			filter.$or = [
// 				{product_name: {$regex: q, $option: "i"}},
// 				{description: {$regex: q, $option: "i"}},
// 			];
// 		}

// 		if (category) {
// 			filter.category = category;
// 		}

// 		const search = await Products.find({});
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).send("internal server error");
// 	}
// });

module.exports = router;
