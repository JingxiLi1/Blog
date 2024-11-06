// routes/index.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('author', 'email')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();
    res.render('index', { posts });
  } catch (err) {
    console.error(err);
    res.render('index', { posts: [] });
  }
});

module.exports = router;
