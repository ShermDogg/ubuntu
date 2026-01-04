const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLList,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInt
} = require('graphql');
const User = require('./models/User');
const Article = require('./models/Article');
const Comment = require('./models/Comment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// User Type
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    avatar: { type: GraphQLString },
    role: { type: GraphQLString },
    createdAt: { type: GraphQLString }
  })
});

// Article Type
const ArticleType = new GraphQLObjectType({
  name: 'Article',
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    excerpt: { type: GraphQLString },
    content: { type: GraphQLString },
    category: { type: GraphQLString },
    author: { type: GraphQLString },
    featuredImage: { type: GraphQLString },
    tags: { type: new GraphQLList(GraphQLString) },
    views: { type: GraphQLInt },
    readTime: { type: GraphQLInt },
    isFeatured: { type: GraphQLBoolean },
    publishedAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString }
  })
});

// Comment Type
const CommentType = new GraphQLObjectType({
  name: 'Comment',
  fields: () => ({
    id: { type: GraphQLID },
    articleId: { type: GraphQLID },
    content: { type: GraphQLString },
    createdAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
    user: {
      type: UserType,
      async resolve(parent) {
        return await User.findById(parent.userId);
      }
    }
  })
});

// Auth Payload Type
const AuthPayloadType = new GraphQLObjectType({
  name: 'AuthPayload',
  fields: () => ({
    token: { type: GraphQLString },
    user: { type: UserType }
  })
});

// Root Query
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    // Get all articles with pagination
    articles: {
      type: new GraphQLList(ArticleType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 12 },
        skip: { type: GraphQLInt, defaultValue: 0 },
        category: { type: GraphQLString },
        isFeatured: { type: GraphQLBoolean }
      },
      async resolve(parent, args) {
        const query = { isPublished: true };
        if (args.category) query.category = args.category;
        if (args.isFeatured !== undefined) query.isFeatured = args.isFeatured;
        
        return await Article.find(query)
          .sort({ publishedAt: -1 })
          .skip(args.skip)
          .limit(args.limit);
      }
    },

    // Get single article by ID
    article: {
      type: ArticleType,
      args: { id: { type: GraphQLID } },
      async resolve(parent, args) {
        const article = await Article.findById(args.id);
        if (article) {
          article.views += 1;
          await article.save();
        }
        return article;
      }
    },

    // Get featured articles
    featuredArticles: {
      type: new GraphQLList(ArticleType),
      async resolve() {
        return await Article.find({ isFeatured: true, isPublished: true })
          .sort({ publishedAt: -1 })
          .limit(5);
      }
    },

    // Get comments for article
    comments: {
      type: new GraphQLList(CommentType),
      args: { articleId: { type: GraphQLID } },
      async resolve(parent, args) {
        return await Comment.find({ articleId: args.articleId })
          .sort({ createdAt: -1 });
      }
    },

    // Search articles
    searchArticles: {
      type: new GraphQLList(ArticleType),
      args: { query: { type: GraphQLString } },
      async resolve(parent, args) {
        if (!args.query) return [];
        
        return await Article.find({
          $or: [
            { title: { $regex: args.query, $options: 'i' } },
            { content: { $regex: args.query, $options: 'i' } },
            { tags: { $regex: args.query, $options: 'i' } }
          ],
          isPublished: true
        }).limit(20);
      }
    },

    // Get user profile
    me: {
      type: UserType,
      async resolve(parent, args, context) {
        if (!context.user) throw new Error('Not authenticated');
        return await User.findById(context.user.id);
      }
    }
  }
});

// Mutations
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    // User Registration
    register: {
      type: AuthPayloadType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        lastName: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parent, args) {
        // Check if user exists
        const existingUser = await User.findOne({ email: args.email.toLowerCase() });
        if (existingUser) {
          throw new Error('User already exists with this email');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(args.password, 10);

        // Generate avatar
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(args.firstName + ' ' + args.lastName)}&background=007bff&color=fff`;

        // Create user
        const user = new User({
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email.toLowerCase(),
          password: hashedPassword,
          avatar,
          role: 'reader',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await user.save();

        // Generate token
        const token = generateToken(user);

        return { 
          token, 
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar,
            role: user.role
          }
        };
      }
    },

    // User Login
    login: {
      type: AuthPayloadType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parent, args) {
        // Find user
        const user = await User.findOne({ email: args.email.toLowerCase() });
        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Check password
        const isValid = await bcrypt.compare(args.password, user.password);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user);

        return { 
          token, 
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar,
            role: user.role
          }
        };
      }
    },

    // Create Article (Admin only)
    createArticle: {
      type: ArticleType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        excerpt: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        category: { type: new GraphQLNonNull(GraphQLString) },
        author: { type: GraphQLString },
        featuredImage: { type: GraphQLString },
        tags: { type: new GraphQLList(GraphQLString) },
        isFeatured: { type: GraphQLBoolean, defaultValue: false }
      },
      async resolve(parent, args, context) {
        if (!context.user || context.user.role !== 'admin') {
          throw new Error('Admin access required');
        }

        // Calculate read time
        const wordCount = args.content.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / 200);

        const article = new Article({
          title: args.title,
          excerpt: args.excerpt,
          content: args.content,
          category: args.category,
          author: args.author || 'Admin User',
          featuredImage: args.featuredImage || 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1',
          tags: args.tags || [],
          readTime: readTime,
          isFeatured: args.isFeatured,
          isPublished: true,
          views: 0,
          publishedAt: new Date()
        });

        return await article.save();
      }
    },

    // Add Comment
    addComment: {
      type: CommentType,
      args: {
        articleId: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Please login to comment');
        }

        const comment = new Comment({
          articleId: args.articleId,
          userId: context.user.id,
          content: args.content
        });

        return await comment.save();
      }
    },

    // Update Comment
    updateComment: {
      type: CommentType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        content: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Please login to update comment');
        }

        const comment = await Comment.findById(args.id);
        if (!comment) {
          throw new Error('Comment not found');
        }

        // Check if user owns the comment
        if (comment.userId.toString() !== context.user.id) {
          throw new Error('You can only edit your own comments');
        }

        comment.content = args.content;
        comment.updatedAt = new Date();

        return await comment.save();
      }
    },

    // Delete Comment
    deleteComment: {
      type: CommentType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) }
      },
      async resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Please login to delete comment');
        }

        const comment = await Comment.findById(args.id);
        if (!comment) {
          throw new Error('Comment not found');
        }

        // Check if user owns the comment or is admin
        if (comment.userId.toString() !== context.user.id && context.user.role !== 'admin') {
          throw new Error('You can only delete your own comments');
        }

        await Comment.findByIdAndDelete(args.id);
        return comment;
      }
    }
  }
});

// Create and export the schema
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});