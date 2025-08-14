const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register a new user
router.post('/register', async (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  try {
    const newUser = await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(400).json({ message: 'Cannot find user' });
    }

    const validPassword = await user.comparePassword(req.body.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create and assign a token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;