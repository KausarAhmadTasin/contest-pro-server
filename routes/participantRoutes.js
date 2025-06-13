const express = require("express");
const router = express.Router();
const participantController = require("../controllers/participantController");
const verifyToken = require("../middleware/authMiddleware");
const { verifyCreator } = require("../middleware/roleMiddleware");

router.get("/", verifyToken, participantController.getParticipants);
router.get("/stats", participantController.getParticipantStats);
router.post("/", participantController.createParticipant);
router.patch(
  "/:id",
  verifyToken,
  verifyCreator,
  participantController.declareWinner
);
router.get(
  "/myParticipations",
  verifyToken,
  participantController.getMyParticipations
);

module.exports = router;
