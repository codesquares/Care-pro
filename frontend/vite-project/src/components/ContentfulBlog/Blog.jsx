import { useContext, useState } from "react";
import { createClient } from "contentful";
import { Link } from "react-router-dom";
import BlogPost from "./BlogPost";
import "./styles.css";
import { BlogContext } from "../../main-app/context/BlogContext";

export default function Blog() {
  const { posts, loading } = useContext(BlogContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Extract unique categories from posts
  const categories = ["All", ...new Set(posts.map(post => post.fields.category || "Uncategorized"))];

  // Filter posts based on search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.fields.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.fields.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper function to calculate read time
  const calculateReadTime = (content) => {
    const text = content?.content?.[0]?.content?.[0]?.value || "";
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed
    return minutes;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  if (loading) {
    return (
      <div className="blog-page">
        <div className="blog-hero">
          <div className="hero-content">
            <h1 className="hero-title">Our Blog</h1>
            <p className="hero-subtitle">Insights, tips, and stories about care</p>
          </div>
        </div>
        <div className="blog-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="blog-page">
        <div className="blog-hero">
          <div className="hero-content">
            <h1 className="hero-title">Our Blog</h1>
            <p className="hero-subtitle">Insights, tips, and stories about care</p>
          </div>
        </div>
        <div className="blog-container">
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No Articles Yet</h2>
            <p>Stay tuned! New content coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <div className="blog-hero">
        <div className="hero-content">
          <h1 className="hero-title">Our Blog</h1>
          <p className="hero-subtitle">Insights, tips, and stories about care</p>
          
          {/* Search Bar */}
          <div className="search-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="blog-container">
        {/* Category Filter */}
        <div className="category-filter">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h2>No Results Found</h2>
            <p>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="blog-grid">
            {filteredPosts.map((post, index) => {
              const isFeatured = index === 0;
              const readTime = calculateReadTime(post.fields.content);
              const excerpt = post.fields.content?.content?.[0]?.content?.[0]?.value || "";

              return (
                <article key={post.sys.id} className={`blog-card ${isFeatured ? 'featured' : ''}`}>
                  <Link to={`/contentful-blog/${post.sys.id}`} className="card-link">
                    <div className="card-image-wrapper">
                      <img
                        src={post.fields.featuredImage[0].fields.file.url}
                        alt={post.fields.title}
                        className="card-image"
                        loading="lazy"
                      />
                      {post.fields.category && (
                        <span className="category-badge">{post.fields.category}</span>
                      )}
                      <div className="image-overlay"></div>
                    </div>

                    <div className="card-content">
                      <div className="card-meta">
                        <span className="meta-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {readTime} min read
                        </span>
                        <span className="meta-divider">•</span>
                        <span className="meta-item">
                          {formatDate(post.sys.createdAt)}
                        </span>
                      </div>

                      <h2 className="card-title">{post.fields.title}</h2>
                      <p className="card-excerpt">{truncateText(excerpt, isFeatured ? 200 : 120)}</p>

                      <div className="card-footer">
                        <span className="read-more">
                          Read Article
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
