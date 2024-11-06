const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Middleware: Check if the user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please log in first');
  res.redirect('/users/login');
}

// Display all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'email').exec();
    res.render('posts', { posts });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to load posts');
    res.redirect('/');
  }
});

// New post form
router.get('/new', isLoggedIn, (req, res) => {
  res.render('new-post', { errors: [], title: '', body: '', tags: '' });
});

// Create new post
router.post('/', isLoggedIn, [
  body('title').notEmpty().withMessage('Title cannot be empty').trim().escape(),
  body('body').notEmpty().withMessage('Content cannot be empty'),
  body('tags').optional().trim()
], async (req, res) => {
  const { title, body: content, tags } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('new-post', { 
      errors: errors.array(),
      title,
      body: content,
      tags
    });
  }

  const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

  const newPost = new Post({
    title,
    body: content,
    tags: tagArray,
    author: req.user.id
  });

  try {
    await newPost.save();
    req.flash('success_msg', 'Post created');
    res.redirect('/posts');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to create post');
    res.redirect('/posts/new');
  }
});

// Update post
router.put('/:id', isLoggedIn, [
  body('title').notEmpty().withMessage('Title cannot be empty').trim().escape(),
  body('body').notEmpty().withMessage('Content cannot be empty'),
  body('tags').optional().trim()
], async (req, res) => {
  const { title, body: content, tags } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('edit-post', { 
      errors: errors.array(),
      post: { _id: req.params.id, title, body: content, tags }
    });
  }

  const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

  try {
    const post = await Post.findById(req.params.id).exec();
    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/posts');
    }
    if (!post.author.equals(req.user.id)) {
      req.flash('error_msg', 'No permission to edit this post');
      return res.redirect('/posts');
    }

    post.title = title;
    post.body = content;
    post.tags = tagArray;
    post.updatedAt = Date.now();

    await post.save();
    req.flash('success_msg', 'Post updated');
    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to update post');
    res.redirect('/posts');
  }
});

// Display a single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'email' }
      })
      .exec();

    if (!post) {
      req.flash('error_msg', 'Post not found');
      return res.redirect('/posts');
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'email')
      .lean()
      .exec();

    const commentMap = {};
    comments.forEach(comment => {
      comment.replies = [];
      commentMap[comment._id] = comment;
    });

    const roots = [];
    comments.forEach(comment => {
      if (comment.parent) {
        if (commentMap[comment.parent]) {
          commentMap[comment.parent].replies.push(comment);
        }
      } else {
        roots.push(comment);
      }
    });

    res.render('post', { post, comments: roots });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Unable to load post');
    res.redirect('/posts');
  }
});

module.exports = router;
