const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");
const { verifyAdmin } = require("../middleware/roleMiddleware");

router.get("/", verifyToken, verifyAdmin, userController.getAllUsers);
router.get("/role/:email", verifyToken, userController.getUserRole);
router.post("/", userController.createUser);
router.delete("/:id", verifyToken, verifyAdmin, userController.deleteUser);
router.patch("/:id", verifyToken, verifyAdmin, userController.updateUserRole);

module.exports = router;
