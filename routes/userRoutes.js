const express = require("express");
const {
  signup,
  verifyOTP,
  login,
  getUserDetails,
  deleteAccount,
  updateProfile,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  subscribe,
  unsubscribe,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

const router = express.Router();

// Authentication routes
router.post("/signup", signup);
router.post("/verify", verifyOTP);
router.post("/login", login);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

// Protected routes (require authentication)
router.get("/me", auth, getUserDetails);
router.delete("/delete", auth, deleteAccount);
router.put("/update", auth, updateProfile);

router.post("/subscribe", auth, subscribe);
router.post("/unsubscribe", auth, unsubscribe);

module.exports = router;