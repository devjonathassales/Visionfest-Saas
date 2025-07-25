const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken); // ✅ refresh
router.post("/logout", authController.logout);
router.get("/me", require("../middlewares/authMiddleware"), authController.getProfile);

module.exports = router;
