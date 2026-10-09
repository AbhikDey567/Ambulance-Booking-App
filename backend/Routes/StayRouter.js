const express = require('express');
const ensureAuthenticated = require('../Middlewares/Auth');

const router = express.Router();

// Check if user is logged in
router.get('/', ensureAuthenticated, (req, res) => {
  try {
    // Log user details like in the 1st router
    console.log('---- logged in user detail ---', req.user);

    // If middleware passes but somehow req.user is missing
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Authenticated response
    res.status(200).json({
      success: true,
      message: "User is logged in",
      user: req.user,
    });
  } catch (err) {
    console.error("Error in stay router:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
