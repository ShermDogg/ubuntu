const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    minlength: [20, 'Excerpt must be at least 20 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Content must be at least 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['politics', 'culture', 'health', 'education', 'economy', 'justice', 'sports', 'entertainment']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  featuredImage: {
    type: String,
    required: [true, 'Featured image URL is required']
  },
  tags: {
    type: [String],
    default: []
  },
  views: {
    type: Number,
    default: 0
  },
  readTime: {
    type: Number,
    default: 5
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;