import { useContext, useState } from "react";
import { createClient } from "contentful";
import { Link } from "react-router-dom";
import BlogPost from "./BlogPost";
import "./styles.scss";
import { BlogContext } from "../../main-app/context/BlogContext";

export default function Blog() {
  const { posts, loading } = useContext(BlogContext);
  if (loading) return <p>Loading...</p>;
  // console.log("posts inside blog===========>", posts);
  if (posts.length === 0) return <p className="no-post">No posts found</p>;
  return (
    <div className="blog-view">

      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.sys.id} className="post">
            <Link to={`/contentful-blog/${post.sys.id}`} className="post-link">
              <div className="side1">
                

                <div className="post-image-container">
                  <img
                    src={post.fields.featuredImage[0].fields.file.url}
                    alt={post.fields.title}
                    className="post-image"
                  />
                </div>
              </div>

              <div className="post-content">
              <div className="post-title-container">
                  <h2 className="post-title">{post.fields.title}</h2>
                </div>
                <p className="post-short-content">{post.fields.content.content[0].content[0].value}</p>
              </div>

            </Link>
          </li>
        ))}
      </ul>

    </div>
  );
}
