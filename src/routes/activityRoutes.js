const express = require("express");
const router = express.Router();

const activityController = require("../controllers/activityController");

// Public activity routes for users
router.get("/", activityController.getActivities);
router.get("/:id", activityController.getActivityById);

module.exports = router;
