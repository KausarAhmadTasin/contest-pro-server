const express = require("express");
const router = express.Router();
const contestController = require("../controllers/contestController");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin, verifyCreator } = require("../middleware/roleMiddleware");

router.get("/", contestController.getAllContests);
router.get("/:id", verifyToken, contestController.getContestById);
router.post("/", verifyToken, verifyCreator, contestController.createContest);
router.patch(
  "/approve/:id",
  verifyToken,
  verifyAdmin,
  contestController.approveContest
);
router.delete(
  "/:id",
  verifyToken,
  verifyCreator,
  contestController.deleteContest
);
router.patch("/rating", contestController.addRating);

module.exports = router;
