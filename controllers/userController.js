const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Signup function
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      otp,
      isVerified: false,
      isSubscribed: false,
      subscribedAt: null
    });
    await user.save();

    await sendOTP(email, otp);

    res.status(201).json({ msg: "OTP sent to your email" });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify OTP function
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (!user.otp) {
      return res.status(400).json({ error: "OTP expired or not generated" });
    }

    if (otp !== user.otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = "";
    await user.save();

    res.status(200).json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login function
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(400).json({ error: "Email not verified" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1000h",
    });

    res
      .status(200)
      .json({ 
        token, 
        user: { 
          name: user.name, 
          email: user.email,
          isSubscribed: user.isSubscribed,
          subscribedAt: user.subscribedAt
        }
      });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user details function
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ msg: "Account deleted successfully" });
  } catch (err) {
    console.error("Error deleting account:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { name } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.name = name;
    await user.save();

    res.status(200).json({ 
      msg: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        isSubscribed: user.isSubscribed,
        subscribedAt: user.subscribedAt
      }
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    await user.save();

    await sendOTP(email, otp);

    res.status(200).json({ msg: "OTP sent to your email for password reset" });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Verify OTP for Password Reset
exports.verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (otp !== user.otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    user.otp = "";
    await user.save();

    res.status(200).json({ msg: "OTP verified successfully" });
  } catch (err) {
    console.error("OTP verification error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ msg: "Password reset successfully" });
  } catch (err) {
    console.error("Password reset error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Subscribe function
exports.subscribe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isSubscribed = true;
    user.subscribedAt = new Date(); // Set subscription timestamp
    await user.save();

    res.status(200).json({ 
      msg: "Subscribed successfully",
      isSubscribed: user.isSubscribed,
      subscribedAt: user.subscribedAt
    });
  } catch (err) {
    console.error("Subscribe error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Unsubscribe function
exports.unsubscribe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isSubscribed = false;
    user.subscribedAt = null; // Clear subscription timestamp
    await user.save();

    res.status(200).json({ 
      msg: "Unsubscribed successfully",
      isSubscribed: user.isSubscribed,
      subscribedAt: user.subscribedAt
    });
  } catch (err) {
    console.error("Unsubscribe error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to send OTP
const sendOTP = async (email, otp) => {
  console.log("Sending OTP to:", email);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}`,
    html: `<h2>Your OTP Code: <strong>${otp}</strong></h2>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.response);
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw new Error("Failed to send OTP email");
  }
};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});