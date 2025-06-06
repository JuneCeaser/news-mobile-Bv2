const Newsletter = require("../models/Newsletter");
const User = require("../models/userModel");

// Get newsletters for the authenticated user
const getNewsletters = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user is not subscribed, return an empty array
    if (!user.isSubscribed) {
      return res.status(200).json([]);
    }

    // Fetch newsletters created after subscribedAt, sorted by creation date
    const query = user.subscribedAt
      ? { createdAt: { $gte: user.subscribedAt } }
      : {};
    const newsletters = await Newsletter.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(newsletters);
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    res.status(500).json({
      message: "Error fetching newsletters",
      error: error.message,
    });
  }
};

module.exports = { getNewsletters };