// routes/comments.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Middleware: Check if the user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in first');
  res.redirect('/users/login');
}

// Add a comment
router.post('/:postId', isLoggedIn, [
  body('body').notEmpty().withMessage('Comment content cannot be empty').trim()
], async (req, res) => {
  const { body: commentBody, parentId } = req.body;
  const { postId } = req.params;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    return res.redirect(`/posts/${postId}`);
  }

  try {
    const post = await Post.findById(postId).exec();
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/posts');
    }

    const newComment = new Comment({
      body: commentBody,
      author: req.user.id,
      post: postId,
      parent: parentId || null
    });

    await newComment.save();

    // If it's a reply, don't add it directly to the post's comments array
    if (!parentId) {
      post.comments.push(newComment);
      await post.save();
    }

    req.flash('success_msg', 'Comment added');
    res.redirect(`/posts/${postId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to add comment');
    res.redirect(`/posts/${postId}`);
  }
});

module.exports = router;
