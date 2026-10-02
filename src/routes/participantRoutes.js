const express = require("express");
const router = express.Router();

const participantController = require("../controllers/participantController");
const authenticate = require("../middleware/authMiddleware");

// All participant routes require authentication
router.use(authenticate);

// User participant endpoints
router.post("/", participantController.registerForActivity);
router.get("/my", participantController.getMyRegistrations);
router.put("/:id/withdraw", participantController.withdrawRegistration);
router.put("/:id/revoke-withdraw", participantController.revokeWithdrawRegistration);
router.put("/:id", participantController.updateParticipant);

module.exports = router;
