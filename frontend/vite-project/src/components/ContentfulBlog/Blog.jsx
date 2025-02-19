import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import "./blogStyles.scss";
import { BlogContext } from "../../main-app/context/BlogContext";

export default function Blog() {
  const { posts, loading } = useContext(BlogContext);
  if (loading) return <p>Loading...</p>;
  // console.log("posts inside blog===========>", posts);
  if (posts.length === 0) return <p className="no-post">No posts found</p>;
  return (
    <div className="blog-view">

      <ul className="blog-list">
        {posts.map((post) => (
          <li key={post.sys.id} className="blog">
            <Link to={`/contentful-blog/${post.sys.id}`} className="blog-link">
              <div className="side1">
                

                <div className="blog-image-container">
                  <img
                    src={post.fields.featuredImage[0].fields.file.url}
                    alt={post.fields.title}
                    className="blog-image"
                  />
                </div>
              </div>

              <div className="blog-content">
              <div className="blog-title-container">
                  <h2 className="blog-title">{post.fields.title}</h2>
                </div>
                <p className="blog-short-content">{post.fields.content.content[0].content[0].value}</p>
              </div>

            </Link>
          </li>
        ))}
      </ul>

    </div>
  );
}
