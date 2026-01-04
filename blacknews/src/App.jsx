import { Routes, Route, Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

import md5 from 'md5';

// GraphQL Queries
const GET_ARTICLES = gql`
  query GetArticles($limit: Int, $skip: Int, $category: String) {
    articles(limit: $limit, skip: $skip, category: $category) {
      id
      title
      excerpt
      category
      author
      featuredImage
      tags
      views
      readTime
      publishedAt
    }
  }
`;

const GET_FEATURED_ARTICLES = gql`
  query GetFeaturedArticles {
    featuredArticles {
      id
      title
      excerpt
      category
      author
      featuredImage
      publishedAt
    }
  }
`;

const GET_ARTICLE = gql`
  query GetArticle($id: ID!) {
    article(id: $id) {
      id
      title
      content
      category
      author
      featuredImage
      views
      readTime
      publishedAt
    }
  }
`;

const GET_COMMENTS = gql`
  query GetComments($articleId: ID!) {
    comments(articleId: $articleId) {
      id
      content
      createdAt
      user {
        id
        firstName
        lastName
        email
        avatar
      }
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        firstName
        lastName
        email
        avatar
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($firstName: String!, $lastName: String!, $email: String!, $password: String!) {
    register(firstName: $firstName, lastName: $lastName, email: $email, password: $password) {
      token
      user {
        id
        firstName
        lastName
        email
        avatar
      }
    }
  }
`;

const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($articleId: ID!, $content: String!) {
    addComment(articleId: $articleId, content: $content) {
      id
      content
      createdAt
    }
  }
`;

// Home Component
function Home() {
  const { loading, error, data } = useQuery(GET_FEATURED_ARTICLES);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return <p className="alert alert-danger">Error: {error.message}</p>;

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log('Subscribing:', email);
    setIsSubscribed(true);
    setEmail('');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section position-relative overflow-hidden text-white" 
               style={{
                 background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853")',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 minHeight: '60vh'
               }}>
        <div className="container position-relative z-1 d-flex align-items-center" style={{ minHeight: '60vh' }}>
          <div className="row">
            <div className="col-lg-8">
              <h1 className="display-3 fw-bold mb-4">Afro American News & Culture</h1>
              <p className="lead mb-4">Stay informed on the latest news, culture, and issues impacting the Black community worldwide.</p>
              <form onSubmit={handleSubscribe} className="row g-3">
                <div className="col-md-6">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email for updates"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary btn-lg w-100">
                    Subscribe
                  </button>
                </div>
              </form>
              {isSubscribed && (
                <div className="alert alert-success mt-3" role="alert">
                  Thank you for subscribing to our newsletter!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h1">Featured Stories</h2>
            <Link to="/articles" className="btn btn-outline-primary">
              View All Articles →
            </Link>
          </div>
          
          <div className="row g-4">
            {data?.featuredArticles?.map((article, index) => (
              <div key={article.id} className={index === 0 ? "col-lg-8" : "col-lg-4"}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-img-top position-relative overflow-hidden" 
                       style={{ 
                         height: index === 0 ? '400px' : '250px',
                         backgroundImage: `url(${article.featuredImage})`,
                         backgroundSize: 'cover',
                         backgroundPosition: 'center'
                       }}>
                    <div className="position-absolute top-0 start-0 m-3">
                      <span className="badge bg-primary">{article.category}</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h3 className={`card-title ${index === 0 ? 'h2' : 'h4'}`}>
                      <Link to={`/article/${article.id}`} className="text-dark text-decoration-none">
                        {article.title}
                      </Link>
                    </h3>
                    <p className="card-text">{article.excerpt}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">By {article.author}</small>
                      <small className="text-muted">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Explore Topics</h2>
          <div className="row g-3">
            {['politics', 'culture', 'health', 'education', 'economy', 'justice'].map((category) => (
              <div key={category} className="col-md-4 col-lg-2">
                <Link 
                  to={`/category/${category}`}
                  className="btn btn-outline-dark w-100 text-capitalize"
                >
                  {category}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Articles Component
function Articles() {
  // Fixed: Safely access params with optional chaining
  const params = useParams();
  const categoryFromUrl = params?.category || '';
  
  const [category, setCategory] = useState(categoryFromUrl);
  const { loading, error, data, refetch } = useQuery(GET_ARTICLES, {
    variables: { 
      limit: 12, 
      skip: 0, 
      category: category || undefined 
    }
  });

  // Fixed: Update category when URL changes
  useEffect(() => {
    setCategory(categoryFromUrl || '');
  }, [categoryFromUrl]);

  // Fixed: Refetch when category changes
  useEffect(() => {
    refetch({ category: category || undefined });
  }, [category, refetch]);

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return <p className="alert alert-danger">Error: {error.message}</p>;

  return (
    <div className="container py-5">
      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 mb-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Filter by Category</h5>
                <div className="list-group list-group-flush">
                  <button 
                    className={`list-group-item list-group-item-action ${category === '' ? 'active' : ''}`}
                    onClick={() => setCategory('')}
                  >
                    All Categories
                  </button>
                  {['politics', 'culture', 'health', 'education', 'economy', 'justice', 'sports', 'entertainment'].map((cat) => (
                    <button 
                      key={cat}
                      className={`list-group-item list-group-item-action text-capitalize ${category === cat ? 'active' : ''}`}
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="col-lg-9">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h3 mb-0">
              {category ? category.charAt(0).toUpperCase() + category.slice(1) + ' News' : 'All Articles'}
            </h2>
            <span className="text-muted">
              {data?.articles?.length || 0} articles found
            </span>
          </div>
          
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {data?.articles?.map((article) => (
              <div key={article.id} className="col">
                <div className="card border-0 shadow-sm h-100 hover-shadow transition-all">
                  <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                    <img 
                      src={article.featuredImage} 
                      alt={article.title}
                      className="img-fluid w-100 h-100 object-fit-cover"
                    />
                    <div className="position-absolute top-0 start-0 m-2">
                      <span className="badge bg-primary">{article.category}</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">
                      <Link to={`/article/${article.id}`} className="text-dark text-decoration-none">
                        {article.title}
                      </Link>
                    </h5>
                    <p className="card-text text-muted small">{article.excerpt.substring(0, 100)}...</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <i className="bi bi-eye me-1"></i> {article.views}
                      </small>
                      <small className="text-muted">{article.readTime} min read</small>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent border-top-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">By {article.author}</small>
                      <small className="text-muted">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {(!data?.articles || data.articles.length === 0) && (
            <div className="text-center py-5">
              <div className="alert alert-info">
                <h4 className="alert-heading">No articles found</h4>
                <p>No articles are available in this category yet.</p>
                <button 
                  className="btn btn-outline-primary mt-2"
                  onClick={() => setCategory('')}
                >
                  View all articles
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Article Detail Component
function ArticleDetail() {
  const { id } = useParams();
  const [comment, setComment] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  
  const { loading: articleLoading, error: articleError, data: articleData } = useQuery(GET_ARTICLE, {
    variables: { id }
  });

  const { loading: commentsLoading, error: commentsError, data: commentsData, refetch } = useQuery(GET_COMMENTS, {
    variables: { articleId: id }
  });

  const [addComment] = useMutation(ADD_COMMENT_MUTATION, {
    onCompleted: () => {
      setComment('');
      refetch();
    }
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('Please login to comment');
      return;
    }
    addComment({ variables: { articleId: id, content: comment } });
  };

  if (articleLoading || commentsLoading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (articleError) return <p className="alert alert-danger">Error: {articleError.message}</p>;
  if (commentsError) return <p className="alert alert-danger">Error: {commentsError.message}</p>;

  const article = articleData?.article;

  if (!article) return <p className="alert alert-danger">Article not found</p>;

  return (
    <div className="container py-5">
      <article>
        {/* Article Header */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3">{article.title}</h1>
          <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
            <span className="badge bg-primary fs-6">{article.category}</span>
            <span className="text-muted">
              <i className="bi bi-clock me-1"></i> {article.readTime} min read
            </span>
            <span className="text-muted">
              <i className="bi bi-eye me-1"></i> {article.views} views
            </span>
          </div>
          <div className="d-flex justify-content-center align-items-center gap-3">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(article.author)}&background=007bff&color=fff`}
              alt={article.author}
              className="rounded-circle"
              width="40"
              height="40"
            />
            <div>
              <p className="mb-0 fw-bold">{article.author}</p>
              <p className="mb-0 text-muted small">
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="mb-5">
          <img 
            src={article.featuredImage} 
            alt={article.title}
            className="img-fluid rounded shadow"
            style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Article Content */}
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="article-content" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
              {article.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>

            {/* Comments Section */}
            <div className="mt-5 pt-5 border-top">
              <h3 className="mb-4">
                Comments ({commentsData?.comments?.length || 0})
              </h3>

              {/* Comment Form */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <form onSubmit={handleCommentSubmit}>
                    <div className="mb-3">
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder={isLoggedIn ? "Share your thoughts..." : "Please login to comment"}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={!isLoggedIn}
                        required
                      ></textarea>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      {isLoggedIn ? (
                        <button type="submit" className="btn btn-primary">
                          Post Comment
                        </button>
                      ) : (
                        <Link to="/login" className="btn btn-primary">
                          Login to Comment
                        </Link>
                      )}
                      <small className="text-muted">
                        Comments are moderated
                      </small>
                    </div>
                  </form>
                </div>
              </div>

              {/* Comments List */}
              <div className="comments-list">
                {commentsData?.comments?.map(comment => {
                  const gravatarHash = md5(comment.user.email.toLowerCase());
                  const gravatarUrl = `https://www.gravatar.com/avatar/${gravatarHash}?d=identicon&s=40`;
                  
                  return (
                    <div key={comment.id} className="card border-0 shadow-sm mb-3">
                      <div className="card-body">
                        <div className="d-flex align-items-start">
                          <img 
                            src={gravatarUrl}
                            alt={comment.user.firstName}
                            className="rounded-circle me-3"
                            width="40"
                            height="40"
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">
                                {comment.user.firstName} {comment.user.lastName}
                              </h6>
                              <small className="text-muted">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                            <p className="mb-0">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!commentsData?.comments || commentsData.comments.length === 0) && (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-chat-quote display-4 d-block mb-3"></i>
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

// Auth Components
function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('user', JSON.stringify(data.login.user));
      window.location.href = '/';
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ variables: formData });
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Login</h2>
              {error && (
                <div className="alert alert-danger">
                  {error.message}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <div className="text-center mt-3">
                <p className="mb-0">
                  Don't have an account? <Link to="/register">Register</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [register, { loading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.register.token);
      localStorage.setItem('user', JSON.stringify(data.register.user));
      window.location.href = '/';
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    register({
      variables: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      }
    });
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Create Account</h2>
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </form>
              <div className="text-center mt-3">
                <p className="mb-0">
                  Already have an account? <Link to="/login">Login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <i className="bi bi-newspaper me-2"></i>
            Afro News Network
          </Link>
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/articles">Articles</Link>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  Categories
                </a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/category/politics">Politics</Link></li>
                  <li><Link className="dropdown-item" to="/category/culture">Culture</Link></li>
                  <li><Link className="dropdown-item" to="/category/health">Health</Link></li>
                  <li><Link className="dropdown-item" to="/category/education">Education</Link></li>
                  <li><Link className="dropdown-item" to="/category/economy">Economy</Link></li>
                  <li><Link className="dropdown-item" to="/category/justice">Justice</Link></li>
                </ul>
              </li>
            </ul>
            <div className="d-flex align-items-center">
              {user ? (
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-light dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown"
                  >
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=fff&color=000`}
                      alt={user.firstName}
                      className="rounded-circle me-2"
                      width="30"
                      height="30"
                    />
                    {user.firstName}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-light me-2">Login</Link>
                  <Link to="/register" className="btn btn-primary">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/category/:category" element={<Articles />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-5 mt-auto">
        <div className="container">
          <div className="row">
            <div className="col-lg-4 mb-4">
              <h4 className="mb-3">Afro News Network</h4>
              <p className="text-light">
                Dedicated to bringing you the latest news, culture, and perspectives from the African American community.
              </p>
            </div>
            <div className="col-lg-2 col-md-6 mb-4">
              <h5 className="mb-3">Quick Links</h5>
              <ul className="list-unstyled">
                <li><Link to="/" className="text-light text-decoration-none">Home</Link></li>
                <li><Link to="/articles" className="text-light text-decoration-none">Articles</Link></li>
                <li><a href="#about" className="text-light text-decoration-none">About Us</a></li>
                <li><a href="#contact" className="text-light text-decoration-none">Contact</a></li>
              </ul>
            </div>
            <div className="col-lg-3 col-md-6 mb-4">
              <h5 className="mb-3">Categories</h5>
              <ul className="list-unstyled">
                <li><Link to="/category/politics" className="text-light text-decoration-none">Politics</Link></li>
                <li><Link to="/category/culture" className="text-light text-decoration-none">Culture</Link></li>
                <li><Link to="/category/health" className="text-light text-decoration-none">Health</Link></li>
                <li><Link to="/category/education" className="text-light text-decoration-none">Education</Link></li>
              </ul>
            </div>
            <div className="col-lg-3 mb-4">
              <h5 className="mb-3">Subscribe</h5>
              <p className="text-light small">Get the latest news delivered to your inbox.</p>
              <div className="input-group">
                <input type="email" className="form-control" placeholder="Your email" />
                <button className="btn btn-primary" type="button">Subscribe</button>
              </div>
            </div>
          </div>
          <hr className="border-light" />
          <div className="text-center pt-3">
            <p className="mb-0 small">
              © 2024 Afro News Network. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;