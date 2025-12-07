import { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "contentful";
import { BlogContext } from "../../main-app/context/BlogContext";
import "./styles.scss";
import ReactMarkdown from "react-markdown";

const removeText = (text) => {
  // Replace specific patterns with their desired transformations
  return text
    .replace(/text bold/g, "") // Remove "text bold"
    .replace(/document/g, "") // Remove "document"
    .replace(/heading-2([^?.]+[?.])/g, "\n") // Replace "heading-2" with Markdown-style heading
    .replace(/ordered-list/g, "\n1. ") // Replace "ordered-list" with an ordered list marker
    .replace(/list-item/g, "\n- ") // Replace "list-item" with an unordered list marker
    .replace(/paragraph/g, "\n\n") // Replace "paragraph" with a new paragraph marker
    .replace(/bold/g, "") // Replace "bold" with Markdown bold syntax
    .replace(/text/g, "") // Remove "text"
    .replace(/undefined/g, ""); // Remove "undefined"
};

const extractText = (content) => {
  let text = "";

  if (typeof content === "string") {
    text += content + " ";
  } else if (Array.isArray(content)) {
    content.forEach((item) => {
      text += extractText(item);
    });
  } else if (typeof content === "object" && content !== null) {
    Object.values(content).forEach((value) => {
      text += extractText(value);
    });
  }

  const newText = removeText(text);
  return newText.trim(); // Trim any leading or trailing whitespace
};
export default function BlogPost() {

  const { id } = useParams();
  const navigate = useNavigate();

  const { posts, loading } = useContext(BlogContext);
  
  if (loading) {
    return (
      <div className="post-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  const post = posts.find((post) => post.sys.id === id);

  if (!post) return <p className="no-post-error">Article not found</p>;

  const allText = extractText(post.fields.content);

  // Calculate read time
  const words = allText.split(/\s+/).length;
  const readTime = Math.ceil(words / 200);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="post-container">
      <button className="back-to-blog" onClick={() => navigate('/contentful-blog')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to Blog
      </button>
      <div className="post-image-container">
        <img
          src={post.fields.featuredImage[0].fields.file.url}
          alt={post.fields.title}
          className="post-image"
        />
        <div className="title">
          <h1 className="post-title">{post.fields.title}</h1>
        </div>
      </div>

      <div className="main-content">
        <div className="post-meta-bar">
          <div className="meta-items">
            <span className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {formatDate(post.sys.createdAt)}
            </span>
            <span className="meta-divider">•</span>
            <span className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {readTime} min read
            </span>
            {post.fields.category && (
              <>
                <span className="meta-divider">•</span>
                <span className="category-tag">{post.fields.category}</span>
              </>
            )}
          </div>
        </div>

        <div className="post-content-wrapper">
          <ReactMarkdown>{allText}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
