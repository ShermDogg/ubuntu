const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const schema = require('./schema');
const Article = require('./models/Article');
const User = require('./models/User');
const articlesData = require('./data/articles.json');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Authentication helper
const getAuthUser = (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) return null;
    
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (err) {
    return null;
  }
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/afronews');
    console.log('✅ MongoDB Connected:', conn.connection.host);
    
    // Seed data after connection
    await seedDatabase();
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Seed database function
const seedDatabase = async () => {
  try {
    console.log('🔍 Checking database...');
    
    // Seed articles if empty
    const articleCount = await Article.countDocuments();
    
    if (articleCount === 0) {
      console.log('🌱 Seeding articles...');
      
      const articlesToSeed = articlesData.map((article, index) => ({
        ...article,
        readTime: article.readTime || Math.ceil(article.content.length / 2000),
        publishedAt: new Date(article.publishedAt || new Date().toISOString()),
        views: article.views || Math.floor(Math.random() * 1000) + 500,
        isFeatured: article.isFeatured || (index < 2),
        isPublished: true
      }));
      
      await Article.insertMany(articlesToSeed);
      console.log(`✅ ${articlesToSeed.length} articles seeded!`);
    } else {
      console.log(`📊 Database already has ${articleCount} articles`);
    }

    // Seed admin user if not exists
    const adminEmail = 'admin@afronews.com';
    const adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      console.log('👑 Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=007bff&color=fff',
        emailVerified: true
      });
      
      await admin.save();
      console.log('✅ Admin user created!');
      console.log('📧 Email: admin@afronews.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('👑 Admin user already exists');
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};

// Connect to database
connectDB();

// GraphQL endpoint
app.use('/graphql', graphqlHTTP(async (req) => {
  const user = getAuthUser(req);
  
  return {
    schema: schema,
    graphiql: true,
    context: {
      user,
      req
    }
  };
}));

// Admin panel route - COMPLETE VERSION
app.get('/admin', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Afro News Admin Dashboard</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
      <style>
        :root {
          --primary-color: #007bff;
          --secondary-color: #6c757d;
          --success-color: #28a745;
          --danger-color: #dc3545;
          --warning-color: #ffc107;
          --light-color: #f8f9fa;
          --dark-color: #343a40;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background-color: #f5f7fa;
          color: #333;
        }
        
        .sidebar {
          background: linear-gradient(180deg, #2c3e50 0%, #1a2530 100%);
          color: white;
          min-height: 100vh;
          padding: 0;
          position: fixed;
          width: 250px;
          z-index: 1000;
        }
        
        .main-content {
          margin-left: 250px;
          padding: 20px;
        }
        
        .navbar-custom {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 15px 20px;
        }
        
        .stat-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: transform 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }
        
        .article-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .btn-primary-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          padding: 10px 20px;
          font-weight: 600;
        }
        
        .form-control:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(102, 126, 234, 0.05);
        }
        
        .badge-category {
          font-size: 0.75rem;
          padding: 4px 8px;
        }
        
        .editor-toolbar {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px 5px 0 0;
          border: 1px solid #dee2e6;
        }
        
        .preview-section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
      </style>
    </head>
    <body>
      <!-- Sidebar -->
      <div class="sidebar d-none" id="sidebar">
        <div class="sidebar-header p-4 text-center">
          <h4 class="mb-0">
            <i class="bi bi-newspaper me-2"></i>
            Afro News Admin
          </h4>
          <p class="text-muted small mt-2">Content Management System</p>
        </div>
        
        <div class="sidebar-menu p-3">
          <div class="list-group list-group-flush">
            <a href="#" class="list-group-item list-group-item-action bg-transparent text-white border-0 active" onclick="showSection('dashboard')">
              <i class="bi bi-speedometer2 me-2"></i> Dashboard
            </a>
            <a href="#" class="list-group-item list-group-item-action bg-transparent text-white border-0" onclick="showSection('create')">
              <i class="bi bi-pencil-square me-2"></i> Create Article
            </a>
            <a href="#" class="list-group-item list-group-item-action bg-transparent text-white border-0" onclick="showSection('articles')">
              <i class="bi bi-file-text me-2"></i> Manage Articles
            </a>
            <a href="#" class="list-group-item list-group-item-action bg-transparent text-white border-0" onclick="showSection('stats')">
              <i class="bi bi-bar-chart me-2"></i> Analytics
            </a>
            <div class="mt-5 pt-5">
              <button class="btn btn-outline-light w-100" onclick="logout()">
                <i class="bi bi-box-arrow-right me-2"></i> Logout
              </button>
            </div>
          </div>
        </div>
        
        <div class="sidebar-footer p-3 text-center text-muted small">
          <div>Admin Panel v1.0</div>
          <div id="user-email" class="mt-2"></div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="main-content" id="mainContent">
        <!-- Top Navbar -->
        <nav class="navbar navbar-custom mb-4 d-none" id="navbar">
          <div class="container-fluid">
            <button class="btn btn-outline-secondary" onclick="toggleSidebar()">
              <i class="bi bi-list"></i>
            </button>
            <div class="d-flex align-items-center">
              <div id="current-time" class="me-3"></div>
              <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-person-circle me-2"></i>
                  <span id="admin-name">Admin</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="#" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i> Logout</a></li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
        
        <!-- Login Section -->
        <div id="login-section" class="container mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
              <div class="card shadow-lg border-0">
                <div class="card-header bg-primary text-white text-center py-4">
                  <i class="bi bi-shield-lock display-4 mb-3"></i>
                  <h3>Admin Login</h3>
                  <p class="mb-0">Afro News Content Management</p>
                </div>
                <div class="card-body p-4">
                  <form id="login-form">
                    <div class="mb-3">
                      <label class="form-label">Email Address</label>
                      <input type="email" class="form-control" id="email" value="admin@afronews.com" required>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Password</label>
                      <input type="password" class="form-control" id="password" value="admin123" required>
                    </div>
                    <div class="d-grid gap-2">
                      <button type="submit" class="btn btn-primary btn-lg">
                        <i class="bi bi-box-arrow-in-right me-2"></i> Sign In
                      </button>
                    </div>
                  </form>
                  <div class="alert alert-danger mt-3 d-none" id="login-error"></div>
                </div>
              </div>
              <div class="text-center mt-4 text-muted">
                <p>Default credentials: admin@afronews.com / admin123</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Dashboard Sections -->
        <div id="dashboard-sections" class="d-none">
          <!-- Dashboard -->
          <div id="dashboard" class="section">
            <h2 class="mb-4">Dashboard Overview</h2>
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="stat-card">
                  <div class="d-flex justify-content-between">
                    <div>
                      <h6 class="text-muted">Total Articles</h6>
                      <h2 id="total-articles">0</h2>
                    </div>
                    <div class="stat-icon text-primary">
                      <i class="bi bi-file-text"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="stat-card">
                  <div class="d-flex justify-content-between">
                    <div>
                      <h6 class="text-muted">Featured</h6>
                      <h2 id="featured-articles">0</h2>
                    </div>
                    <div class="stat-icon text-warning">
                      <i class="bi bi-star"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="stat-card">
                  <div class="d-flex justify-content-between">
                    <div>
                      <h6 class="text-muted">Total Views</h6>
                      <h2 id="total-views">0</h2>
                    </div>
                    <div class="stat-icon text-success">
                      <i class="bi bi-eye"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="stat-card">
                  <div class="d-flex justify-content-between">
                    <div>
                      <h6 class="text-muted">Categories</h6>
                      <h2 id="total-categories">0</h2>
                    </div>
                    <div class="stat-icon text-info">
                      <i class="bi bi-tags"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-8">
                <div class="article-card">
                  <h5>Quick Actions</h5>
                  <div class="row mt-3">
                    <div class="col-md-4">
                      <button class="btn btn-outline-primary w-100 mb-2" onclick="showSection('create')">
                        <i class="bi bi-plus-circle me-2"></i> New Article
                      </button>
                    </div>
                    <div class="col-md-4">
                      <button class="btn btn-outline-success w-100 mb-2" onclick="loadArticles()">
                        <i class="bi bi-arrow-clockwise me-2"></i> Refresh
                      </button>
                    </div>
                    <div class="col-md-4">
                      <button class="btn btn-outline-warning w-100 mb-2" onclick="showSection('stats')">
                        <i class="bi bi-graph-up me-2"></i> Analytics
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="article-card">
                  <h5>Recent Articles</h5>
                  <div id="recent-articles" class="mt-3">
                    <div class="text-center py-5">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4">
                <div class="article-card">
                  <h5>System Status</h5>
                  <ul class="list-group list-group-flush mt-3">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Database
                      <span class="badge bg-success" id="db-status">Connected</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Server
                      <span class="badge bg-success">Online</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      GraphQL API
                      <span class="badge bg-success">Active</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      Last Updated
                      <span id="last-updated">Just now</span>
                    </li>
                  </ul>
                </div>
                
                <div class="article-card mt-4">
                  <h5>Category Distribution</h5>
                  <div id="category-chart" class="mt-3">
                    <div class="text-center py-3">
                      <small class="text-muted">Loading categories...</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Create Article Section -->
          <div id="create" class="section d-none">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2>Create New Article</h2>
              <button class="btn btn-secondary" onclick="togglePreview()">
                <i class="bi bi-eye me-2"></i> Preview
              </button>
            </div>
            
            <form id="article-form">
              <div class="row">
                <div class="col-md-8">
                  <div class="article-card">
                    <div class="mb-3">
                      <label class="form-label">Article Title</label>
                      <input type="text" class="form-control" id="article-title" placeholder="Enter a compelling title" required>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Excerpt</label>
                      <textarea class="form-control" id="article-excerpt" rows="2" placeholder="Brief summary of your article" required></textarea>
                      <div class="form-text">This will appear on article cards and search results.</div>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Content</label>
                      <div class="editor-toolbar mb-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="formatText('bold')"><b>B</b></button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="formatText('italic')"><i>I</i></button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="formatText('underline')"><u>U</u></button>
                        <span class="mx-2">|</span>
                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="insertParagraph()">¶ Paragraph</button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="insertList()">• List</button>
                      </div>
                      <textarea class="form-control" id="article-content" rows="12" placeholder="Write your article content here..." required></textarea>
                      <div class="form-text">
                        Word count: <span id="word-count">0</span> words | Est. read time: <span id="read-time">0</span> min
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="article-card">
                    <h6>Article Settings</h6>
                    
                    <div class="mb-3">
                      <label class="form-label">Category</label>
                      <select class="form-select" id="article-category" required>
                        <option value="politics">Politics</option>
                        <option value="culture">Culture</option>
                        <option value="health">Health</option>
                        <option value="education">Education</option>
                        <option value="economy">Economy</option>
                        <option value="justice">Justice</option>
                        <option value="sports">Sports</option>
                        <option value="entertainment">Entertainment</option>
                      </select>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Author</label>
                      <input type="text" class="form-control" id="article-author" value="Admin User" required>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Featured Image URL</label>
                      <input type="url" class="form-control" id="article-image" placeholder="https://images.unsplash.com/photo-...">
                      <div class="form-text">
                        <a href="https://unsplash.com" target="_blank">Find free images on Unsplash</a>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Tags (comma separated)</label>
                      <input type="text" class="form-control" id="article-tags" placeholder="news, culture, technology">
                      <div class="form-text">Add relevant keywords for better searchability</div>
                    </div>
                    
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="article-featured">
                      <label class="form-check-label">Featured Article</label>
                      <div class="form-text">Show on homepage</div>
                    </div>
                    
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="article-published" checked>
                      <label class="form-check-label">Publish Immediately</label>
                    </div>
                    
                    <div class="d-grid gap-2">
                      <button type="submit" class="btn btn-primary-custom">
                        <i class="bi bi-cloud-upload me-2"></i> Publish Article
                      </button>
                      <button type="button" class="btn btn-outline-secondary" onclick="saveDraft()">
                        <i class="bi bi-save me-2"></i> Save as Draft
                      </button>
                    </div>
                  </div>
                  
                  <div class="article-card mt-4">
                    <h6>Quick Tips</h6>
                    <ul class="small mt-2">
                      <li>Write clear, engaging headlines</li>
                      <li>Use images from Unsplash (free)</li>
                      <li>Add relevant tags for SEO</li>
                      <li>Check spelling and grammar</li>
                      <li>Use featured status for important articles</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
            
            <!-- Preview Section -->
            <div id="preview-section" class="mt-4 d-none">
              <div class="article-card">
                <h5>Article Preview</h5>
                <div class="preview-section mt-3">
                  <h2 id="preview-title">Article Title</h2>
                  <div class="mb-3">
                    <span class="badge bg-primary" id="preview-category">Category</span>
                    <span class="text-muted ms-2" id="preview-date">Date</span>
                    <span class="text-muted ms-2" id="preview-read-time">0 min read</span>
                  </div>
                  <p class="lead" id="preview-excerpt">Article excerpt goes here...</p>
                  <div id="preview-content" class="mt-4">
                    <p>Article content will appear here...</p>
                  </div>
                  <div class="mt-4 pt-4 border-top">
                    <p class="text-muted">Author: <span id="preview-author">Author Name</span></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div id="article-result" class="alert d-none mt-3"></div>
          </div>
          
          <!-- Manage Articles Section -->
          <div id="articles" class="section d-none">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2>Manage Articles</h2>
              <div class="d-flex">
                <input type="text" class="form-control me-2" id="search-articles" placeholder="Search articles..." style="width: 300px;">
                <button class="btn btn-primary" onclick="loadArticles()">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            
            <div class="article-card">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Author</th>
                      <th>Views</th>
                      <th>Status</th>
                      <th>Published</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="articles-table">
                    <tr>
                      <td colspan="7" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span id="table-info">Loading articles...</span>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-secondary" onclick="changePage(-1)">Previous</button>
                  <span class="mx-2" id="current-page">1</span>
                  <button class="btn btn-sm btn-outline-secondary" onclick="changePage(1)">Next</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Analytics Section -->
          <div id="stats" class="section d-none">
            <h2 class="mb-4">Analytics Dashboard</h2>
            
            <div class="row">
              <div class="col-md-8">
                <div class="article-card">
                  <h5>Views Over Time</h5>
                  <div id="views-chart" class="mt-3" style="height: 300px;">
                    <div class="text-center py-5">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4">
                <div class="article-card">
                  <h5>Top Categories</h5>
                  <div id="top-categories" class="mt-3">
                    <div class="text-center py-3">
                      <small class="text-muted">Loading data...</small>
                    </div>
                  </div>
                </div>
                
                <div class="article-card mt-4">
                  <h5>Performance</h5>
                  <div class="mt-3">
                    <div class="mb-3">
                      <label>Most Viewed Article</label>
                      <div id="most-viewed" class="text-muted small">Loading...</div>
                    </div>
                    <div class="mb-3">
                      <label>Average Read Time</label>
                      <div id="avg-read-time" class="text-muted small">Loading...</div>
                    </div>
                    <div class="mb-3">
                      <label>Articles This Month</label>
                      <div id="month-articles" class="text-muted small">Loading...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bootstrap JS -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
      
      <script>
        // Global variables
        let token = localStorage.getItem('admin_token');
        let currentUser = null;
        let articles = [];
        let currentPage = 1;
        const articlesPerPage = 10;
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
          updateTime();
          setInterval(updateTime, 60000);
          
          if (token) {
            checkAuth();
          }
          
          // Setup event listeners
          document.getElementById('login-form').addEventListener('submit', handleLogin);
          document.getElementById('article-form').addEventListener('submit', handleArticleSubmit);
          document.getElementById('article-content').addEventListener('input', updateWordCount);
          document.getElementById('search-articles').addEventListener('input', filterArticles);
          
          // Load draft if exists
          loadDraft();
        });
        
        // Time updater
        function updateTime() {
          const now = new Date();
          document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        
        // Login handler
        async function handleLogin(e) {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const errorDiv = document.getElementById('login-error');
          
          try {
            const response = await fetch('/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: \`
                  mutation Login(\$email: String!, \$password: String!) {
                    login(email: \$email, password: \$password) {
                      token
                      user {
                        id
                        firstName
                        lastName
                        email
                        role
                      }
                    }
                  }
                \`,
                variables: { email, password }
              })
            });
            
            const result = await response.json();
            
            if (result.errors) {
              errorDiv.textContent = 'Error: ' + result.errors[0].message;
              errorDiv.classList.remove('d-none');
            } else if (result.data.login.user.role !== 'admin') {
              errorDiv.textContent = 'Access denied: Admin privileges required';
              errorDiv.classList.remove('d-none');
            } else {
              token = result.data.login.token;
              currentUser = result.data.login.user;
              
              localStorage.setItem('admin_token', token);
              localStorage.setItem('admin_user', JSON.stringify(currentUser));
              
              showDashboard();
              loadDashboardData();
            }
          } catch (error) {
            errorDiv.textContent = 'Network error: ' + error.message;
            errorDiv.classList.remove('d-none');
          }
        }
        
        // Check authentication
        async function checkAuth() {
          try {
            const response = await fetch('/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${token}\`
              },
              body: JSON.stringify({
                query: \`{ me { id email role firstName lastName } }\`
              })
            });
            
            const result = await response.json();
            
            if (result.errors || !result.data.me || result.data.me.role !== 'admin') {
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_user');
              return;
            }
            
            currentUser = result.data.me;
            showDashboard();
            loadDashboardData();
          } catch (error) {
            console.error('Auth check failed:', error);
          }
        }
        
        // Show dashboard
        function showDashboard() {
          document.getElementById('login-section').classList.add('d-none');
          document.getElementById('sidebar').classList.remove('d-none');
          document.getElementById('navbar').classList.remove('d-none');
          document.getElementById('dashboard-sections').classList.remove('d-none');
          
          // Update user info
          document.getElementById('admin-name').textContent = currentUser.firstName + ' ' + currentUser.lastName;
          document.getElementById('user-email').textContent = currentUser.email;
          
          showSection('dashboard');
        }
        
        // Logout
        function logout() {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          token = null;
          currentUser = null;
          
          document.getElementById('login-section').classList.remove('d-none');
          document.getElementById('sidebar').classList.add('d-none');
          document.getElementById('navbar').classList.add('d-none');
          document.getElementById('dashboard-sections').classList.add('d-none');
          
          document.getElementById('email').value = 'admin@afronews.com';
          document.getElementById('password').value = 'admin123';
        }
        
        // Toggle sidebar
        function toggleSidebar() {
          const sidebar = document.getElementById('sidebar');
          const mainContent = document.getElementById('mainContent');
          
          if (sidebar.style.marginLeft === '-250px') {
            sidebar.style.marginLeft = '0';
            mainContent.style.marginLeft = '250px';
          } else {
            sidebar.style.marginLeft = '-250px';
            mainContent.style.marginLeft = '0';
          }
        }
        
        // Show section
        function showSection(sectionName) {
          // Hide all sections
          document.querySelectorAll('.section').forEach(section => {
            section.classList.add('d-none');
          });
          
          // Show selected section
          document.getElementById(sectionName).classList.remove('d-none');
          
          // Update active menu item
          document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
          });
          event.target.closest('a').classList.add('active');
          
          // Load data for section
          switch(sectionName) {
            case 'dashboard':
              loadDashboardData();
              break;
            case 'articles':
              loadArticles();
              break;
            case 'stats':
              loadAnalytics();
              break;
          }
        }
        
        // Load dashboard data
        async function loadDashboardData() {
          try {
            // Load articles
            const articlesResponse = await fetch('/api/articles');
            const articlesData = await articlesResponse.json();
            
            if (articlesData.success) {
              articles = articlesData.articles;
              
              // Update stats
              const totalArticles = articles.length;
              const featuredArticles = articles.filter(a => a.isFeatured).length;
              const totalViews = articles.reduce((sum, article) => sum + article.views, 0);
              const categories = [...new Set(articles.map(a => a.category))].length;
              
              document.getElementById('total-articles').textContent = totalArticles;
              document.getElementById('featured-articles').textContent = featuredArticles;
              document.getElementById('total-views').textContent = totalViews.toLocaleString();
              document.getElementById('total-categories').textContent = categories;
              
              // Update recent articles
              updateRecentArticles();
              
              // Update category chart
              updateCategoryChart();
              
              document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
            }
          } catch (error) {
            console.error('Error loading dashboard data:', error);
          }
        }
        
        // Update recent articles
        function updateRecentArticles() {
          const recentArticlesDiv = document.getElementById('recent-articles');
          const recent = articles.slice(0, 5);
          
          if (recent.length === 0) {
            recentArticlesDiv.innerHTML = '<p class="text-muted text-center">No articles yet</p>';
            return;
          }
          
          const html = recent.map(article => \`
            <div class="border-bottom pb-3 mb-3">
              <div class="d-flex justify-content-between">
                <h6 class="mb-1">\${article.title}</h6>
                <span class="badge bg-primary badge-category">\${article.category}</span>
              </div>
              <p class="text-muted small mb-1">\${article.excerpt.substring(0, 100)}...</p>
              <div class="d-flex justify-content-between">
                <small class="text-muted">
                  <i class="bi bi-eye me-1"></i> \${article.views} views
                  • \${article.readTime} min read
                </small>
                <small class="text-muted">
                  \${new Date(article.publishedAt).toLocaleDateString()}
                </small>
              </div>
            </div>
          \`).join('');
          
          recentArticlesDiv.innerHTML = html;
        }
        
        // Update category chart
        function updateCategoryChart() {
          const categories = {};
          articles.forEach(article => {
            categories[article.category] = (categories[article.category] || 0) + 1;
          });
          
          const chartDiv = document.getElementById('category-chart');
          let html = '';
          
          for (const [category, count] of Object.entries(categories)) {
            const percentage = (count / articles.length) * 100;
            html += \`
              <div class="mb-2">
                <div class="d-flex justify-content-between mb-1">
                  <span>\${category}</span>
                  <span>\${count}</span>
                </div>
                <div class="progress" style="height: 5px;">
                  <div class="progress-bar" role="progressbar" style="width: \${percentage}%"></div>
                </div>
              </div>
            \`;
          }
          
          chartDiv.innerHTML = html || '<p class="text-muted text-center">No data</p>';
        }
        
        // Handle article submission
        async function handleArticleSubmit(e) {
          e.preventDefault();
          
          const articleData = {
            title: document.getElementById('article-title').value,
            excerpt: document.getElementById('article-excerpt').value,
            content: document.getElementById('article-content').value,
            category: document.getElementById('article-category').value,
            author: document.getElementById('article-author').value,
            featuredImage: document.getElementById('article-image').value || 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1',
            tags: document.getElementById('article-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            isFeatured: document.getElementById('article-featured').checked
          };
          
          try {
            const response = await fetch('/graphql', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${token}\`
              },
              body: JSON.stringify({
                query: \`
                  mutation CreateArticle(
                    \$title: String!, \$excerpt: String!, \$content: String!,
                    \$category: String!, \$author: String, \$featuredImage: String,
                    \$tags: [String!], \$isFeatured: Boolean
                  ) {
                    createArticle(
                      title: \$title, excerpt: \$excerpt, content: \$content,
                      category: \$category, author: \$author, featuredImage: \$featuredImage,
                      tags: \$tags, isFeatured: \$isFeatured
                    ) {
                      id
                      title
                      category
                      publishedAt
                    }
                  }
                \`,
                variables: articleData
              })
            });
            
            const result = await response.json();
            const resultDiv = document.getElementById('article-result');
            
            if (result.errors) {
              resultDiv.className = 'alert alert-danger';
              resultDiv.textContent = 'Error: ' + result.errors[0].message;
            } else {
              resultDiv.className = 'alert alert-success';
              resultDiv.textContent = '✓ Article published successfully! ID: ' + result.data.createArticle.id;
              
              // Clear form
              document.getElementById('article-form').reset();
              document.getElementById('article-author').value = 'Admin User';
              document.getElementById('word-count').textContent = '0';
              document.getElementById('read-time').textContent = '0';
              
              // Load updated articles
              loadDashboardData();
              
              // Clear result after 5 seconds
              setTimeout(() => {
                resultDiv.classList.add('d-none');
              }, 5000);
            }
            
            resultDiv.classList.remove('d-none');
          } catch (error) {
            const resultDiv = document.getElementById('article-result');
            resultDiv.className = 'alert alert-danger';
            resultDiv.textContent = 'Network error: ' + error.message;
            resultDiv.classList.remove('d-none');
          }
        }
        
        // Update word count
        function updateWordCount() {
          const content = document.getElementById('article-content').value;
          const words = content.trim().split(/\\s+/).length;
          const readTime = Math.ceil(words / 200);
          
          document.getElementById('word-count').textContent = words;
          document.getElementById('read-time').textContent = readTime;
        }
        
        // Toggle preview
        function togglePreview() {
          const previewSection = document.getElementById('preview-section');
          const isHidden = previewSection.classList.contains('d-none');
          
          if (isHidden) {
            document.getElementById('preview-title').textContent = 
              document.getElementById('article-title').value || 'Article Title';
            document.getElementById('preview-category').textContent = 
              document.getElementById('article-category').value || 'Category';
            document.getElementById('preview-excerpt').textContent = 
              document.getElementById('article-excerpt').value || 'Article excerpt goes here...';
            document.getElementById('preview-author').textContent = 
              document.getElementById('article-author').value || 'Author Name';
            document.getElementById('preview-date').textContent = 
              new Date().toLocaleDateString();
            document.getElementById('preview-read-time').textContent = 
              document.getElementById('read-time').textContent + ' min read';
            
            // Format content with paragraphs
            const content = document.getElementById('article-content').value;
            const paragraphs = content.split('\\n\\n').filter(p => p.trim());
            const contentHtml = paragraphs.map(p => \`<p>\${p}</p>\`).join('');
            document.getElementById('preview-content').innerHTML = contentHtml || '<p>Article content will appear here...</p>';
          }
          
          previewSection.classList.toggle('d-none');
        }
        
        // Save draft
        function saveDraft() {
          const draft = {
            title: document.getElementById('article-title').value,
            excerpt: document.getElementById('article-excerpt').value,
            content: document.getElementById('article-content').value,
            category: document.getElementById('article-category').value,
            author: document.getElementById('article-author').value,
            featuredImage: document.getElementById('article-image').value,
            tags: document.getElementById('article-tags').value
          };
          
          localStorage.setItem('article_draft', JSON.stringify(draft));
          alert('✓ Draft saved locally!');
        }
        
        // Load draft
        function loadDraft() {
          const savedDraft = localStorage.getItem('article_draft');
          if (savedDraft) {
            try {
              const draft = JSON.parse(savedDraft);
              document.getElementById('article-title').value = draft.title || '';
              document.getElementById('article-excerpt').value = draft.excerpt || '';
              document.getElementById('article-content').value = draft.content || '';
              document.getElementById('article-category').value = draft.category || 'politics';
              document.getElementById('article-author').value = draft.author || '';
              document.getElementById('article-image').value = draft.featuredImage || '';
              document.getElementById('article-tags').value = draft.tags || '';
              updateWordCount();
            } catch (e) {
              console.log('No valid draft found');
            }
          }
        }
        
        // Text formatting
        function formatText(command) {
          const textarea = document.getElementById('article-content');
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = textarea.value.substring(start, end);
          
          let formattedText = '';
          switch(command) {
            case 'bold':
              formattedText = '**' + selectedText + '**';
              break;
            case 'italic':
              formattedText = '*' + selectedText + '*';
              break;
            case 'underline':
              formattedText = '__' + selectedText + '__';
              break;
          }
          
          textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
          textarea.focus();
          textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
          updateWordCount();
        }
        
        // Insert paragraph
        function insertParagraph() {
          const textarea = document.getElementById('article-content');
          const start = textarea.selectionStart;
          const value = textarea.value;
          
          textarea.value = value.substring(0, start) + '\\n\\n' + value.substring(start);
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 2);
          updateWordCount();
        }
        
        // Insert list
        function insertList() {
          const textarea = document.getElementById('article-content');
          const start = textarea.selectionStart;
          const value = textarea.value;
          
          textarea.value = value.substring(0, start) + '\\n- List item' + value.substring(start);
          textarea.focus();
          textarea.setSelectionRange(start + 2, start + 12);
          updateWordCount();
        }
        
        // Load articles for management
        async function loadArticles() {
          try {
            const response = await fetch('/api/articles');
            const data = await response.json();
            
            if (data.success) {
              articles = data.articles;
              renderArticlesTable();
            }
          } catch (error) {
            console.error('Error loading articles:', error);
          }
        }
        
        // Render articles table
        function renderArticlesTable() {
          const searchTerm = document.getElementById('search-articles').value.toLowerCase();
          let filteredArticles = articles;
          
          if (searchTerm) {
            filteredArticles = articles.filter(article => 
              article.title.toLowerCase().includes(searchTerm) ||
              article.category.toLowerCase().includes(searchTerm) ||
              article.author.toLowerCase().includes(searchTerm)
            );
          }
          
          const startIndex = (currentPage - 1) * articlesPerPage;
          const endIndex = startIndex + articlesPerPage;
          const pageArticles = filteredArticles.slice(startIndex, endIndex);
          
          const tbody = document.getElementById('articles-table');
          
          if (pageArticles.length === 0) {
            tbody.innerHTML = \`
              <tr>
                <td colspan="7" class="text-center py-5">
                  <i class="bi bi-file-text display-4 text-muted d-block mb-3"></i>
                  <p class="text-muted">No articles found</p>
                  \${searchTerm ? '<button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById(\\'search-articles\\').value=\\'\\'; loadArticles()">Clear search</button>' : ''}
                </td>
              </tr>
            \`;
          } else {
            tbody.innerHTML = pageArticles.map(article => \`
              <tr>
                <td>
                  <strong>\${article.title}</strong>
                  <div class="small text-muted">\${article.excerpt.substring(0, 60)}...</div>
                </td>
                <td>
                  <span class="badge bg-primary badge-category">\${article.category}</span>
                </td>
                <td>\${article.author}</td>
                <td>\${article.views.toLocaleString()}</td>
                <td>
                  \${article.isFeatured ? '<span class="badge bg-warning">Featured</span>' : ''}
                  <span class="badge bg-success">Published</span>
                </td>
                <td>\${new Date(article.publishedAt).toLocaleDateString()}</td>
                <td>
                  <button class="btn btn-sm btn-outline-primary" onclick="editArticle('\${article.id}')">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteArticle('\${article.id}', '\${article.title}')">
                    <i class="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            \`).join('');
          }
          
          // Update pagination info
          document.getElementById('table-info').textContent = 
            \`Showing \${startIndex + 1}-\${Math.min(endIndex, filteredArticles.length)} of \${filteredArticles.length} articles\`;
          document.getElementById('current-page').textContent = currentPage;
        }
        
        // Filter articles
        function filterArticles() {
          currentPage = 1;
          renderArticlesTable();
        }
        
        // Change page
        function changePage(direction) {
          const searchTerm = document.getElementById('search-articles').value.toLowerCase();
          let filteredArticles = articles;
          
          if (searchTerm) {
            filteredArticles = articles.filter(article => 
              article.title.toLowerCase().includes(searchTerm) ||
              article.category.toLowerCase().includes(searchTerm) ||
              article.author.toLowerCase().includes(searchTerm)
            );
          }
          
          const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
          currentPage += direction;
          
          if (currentPage < 1) currentPage = 1;
          if (currentPage > totalPages) currentPage = totalPages;
          
          renderArticlesTable();
        }
        
        // Delete article
        async function deleteArticle(id, title) {
          if (!confirm(\`Are you sure you want to delete "\\\${title}"? This action cannot be undone.\`)) {
            return;
          }
          
          try {
            const response = await fetch(\`/api/articles/\${id}\`, {
              method: 'DELETE',
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });
            
            const result = await response.json();
            
            if (result.success) {
              alert('✓ Article deleted successfully!');
              loadArticles();
              loadDashboardData();
            } else {
              alert('Error: ' + result.error);
            }
          } catch (error) {
            alert('Error deleting article: ' + error.message);
          }
        }
        
        // Edit article (placeholder)
        function editArticle(id) {
          alert('Edit functionality coming soon! Article ID: ' + id);
          // In a real app, you would load the article data into the create form
          // or redirect to an edit page
        }
        
        // Load analytics
        async function loadAnalytics() {
          try {
            const response = await fetch('/api/articles');
            const data = await response.json();
            
            if (data.success) {
              const articles = data.articles;
              
              // Most viewed article
              const mostViewed = articles.reduce((max, article) => 
                article.views > max.views ? article : max, articles[0] || {});
              document.getElementById('most-viewed').innerHTML = \`
                <strong>\${mostViewed.title || 'N/A'}</strong><br>
                <span>\${mostViewed.views ? mostViewed.views.toLocaleString() : 0} views</span>
              \`;
              
              // Average read time
              const avgReadTime = articles.length ? 
                Math.round(articles.reduce((sum, article) => sum + article.readTime, 0) / articles.length) : 0;
              document.getElementById('avg-read-time').textContent = avgReadTime + ' minutes';
              
              // Articles this month
              const thisMonth = new Date().getMonth();
              const monthArticles = articles.filter(article => 
                new Date(article.publishedAt).getMonth() === thisMonth
              ).length;
              document.getElementById('month-articles').textContent = monthArticles;
              
              // Top categories
              const categories = {};
              articles.forEach(article => {
                categories[article.category] = (categories[article.category] || 0) + 1;
              });
              
              const topCategoriesDiv = document.getElementById('top-categories');
              let html = '';
              for (const [category, count] of Object.entries(categories)) {
                const percentage = Math.round((count / articles.length) * 100);
                html += \`
                  <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                      <span>\${category}</span>
                      <span>\${count} (\${percentage}%)</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                      <div class="progress-bar" role="progressbar" style="width: \${percentage}%"></div>
                    </div>
                  </div>
                \`;
              }
              topCategoriesDiv.innerHTML = html || '<p class="text-muted text-center">No data</p>';
            }
          } catch (error) {
            console.error('Error loading analytics:', error);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// REST endpoint for articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find().limit(50).sort({ publishedAt: -1 });
    res.json({
      success: true,
      count: articles.length,
      articles: articles
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// REST endpoint for deleting articles
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }
    
    const article = await Article.findByIdAndDelete(req.params.id);
    
    if (!article) {
      return res.status(404).json({ 
        success: false, 
        error: 'Article not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const articleCount = await Article.countDocuments();
    const userCount = await User.countDocuments();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      articles: articleCount,
      users: userCount,
      nodeVersion: process.version,
      adminPanel: 'http://localhost:4000/admin'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running on http://localhost:${PORT}
📝 GraphQL ready at http://localhost:${PORT}/graphql
👑 Admin panel: http://localhost:${PORT}/admin
📊 Health check: http://localhost:${PORT}/health
📋 Articles API: http://localhost:4000/api/articles

=== ADMIN CREDENTIALS ===
Email: admin@afronews.com
Password: admin123
=========================
  `);
});
