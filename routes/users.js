// routes/users.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Registration page
router.get('/register', (req, res) => {
  res.render('register', { errors: [] });
});

// Registration handling
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('password2').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  const { email, password, password2 } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('register', { 
      errors: errors.array(),
      email,
      password,
      password2
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      req.flash('error_msg', 'This email is already registered');
      return res.redirect('/users/register');
    }

    const newUser = new User({ email, password });
    await newUser.save();
    req.flash('success_msg', 'Registration successful, please log in');
    res.redirect('/users/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Registration failed, please try again');
    res.redirect('/users/register');
  }
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login handling
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/posts',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Forgot password page
router.get('/forgot', (req, res) => {
  res.render('forgot');
});

// Forgot password handling (simplified)
router.post('/forgot', (req, res) => {
  req.flash('info_msg', 'Please contact the administrator to reset your password');
  res.redirect('/users/login');
});

// Logout
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You have successfully logged out');
    res.redirect('/users/login');
  });
});

module.exports = router;


