const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");

// Public authentication routes
router.post("/login", authController.login);
router.post("/register", authController.register);

// Protected routes
router.get("/me", authenticate, authController.getProfile);

module.exports = router;
