// models/Post.js
const mongoose = require('mongoose');

// Define the schema for Post
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  tags: [String], // Array of tags as strings
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
});

// Pre-save middleware to update the updatedAt field
postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Export the Post model
module.exports = mongoose.model('Post', postSchema);
