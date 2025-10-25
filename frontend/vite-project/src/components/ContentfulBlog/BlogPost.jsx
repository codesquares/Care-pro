import { useContext, useState } from "react";
import { useParams } from "react-router-dom";
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

  const { posts, loading } = useContext(BlogContext);
  if (loading) return <p className="no-post-error">Loading...</p>;

  const post = posts.find((post) => post.sys.id === id);

  const allText = extractText(post.fields.content);

  if (!post) return <p className="no-post-error">Post not found</p>;
  return (
    <div className="post-container">
      <div className="post-image-container">
        <div className="title">
          <h1 className="post-title">{post.fields.title}</h1>

        </div>
        <img
          src={post.fields.featuredImage[0].fields.file.url}
          alt={post.fields.title}
          className="post-image"
        />
      </div>
      <div className="main-content">
        <ReactMarkdown>{allText}</ReactMarkdown>
      </div>

    </div>
  );
}
