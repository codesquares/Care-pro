import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { BlogContext } from "../../main-app/context/BlogContext";
import "./styles.scss";
import ReactMarkdown from "react-markdown";

const formatContent = (content) => {
  if (!content) return "";

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(formatContent).join(""); // Recursively process arrays
  }

  if (typeof content === "object" && content !== null) {
    switch (content.nodeType) {
      case "document":
        return formatContent(content.content);

      case "paragraph":
        return `${formatContent(content.content)}\n\n`; // Ensure paragraphs have spacing

      case "heading-2":
        return `\n## ${formatContent(content.content)}\n\n`;

      case "heading-3":
        return `\n### ${formatContent(content.content)}\n\n`;

      case "unordered-list":
        return `\n${content.content.map((item) => formatContent(item)).join("")}\n`;

      case "ordered-list":
        return `\n${content.content.map((item, index) => `${index + 1}. ${formatContent(item)}`).join("\n")}\n`;

      case "list-item":
        return `- ${formatContent(content.content)}\n`; // Keep list items on the same line

      case "text":
        let textValue = content.value || "";
        if (content.marks?.some((mark) => mark.type === "bold")) {
          return `**${textValue}**`;
        }
        return textValue;

      case "hyperlink": // Handle links
        const url = content.data?.uri;
        const linkText = formatContent(content.content);
        return `[${linkText}](${url})`; // Markdown link format

      default:
        return formatContent(content.content);
    }
  }

  return "";
};



export default function BlogPost() {
  const { id } = useParams();
  const { posts, loading } = useContext(BlogContext);

  if (loading) return <p className="no-post-error">Loading...</p>;

  const post = posts.find((post) => post.sys.id === id);

  if (!post) return <p className="no-post-error">Post not found</p>;

  // FIX: Use `formatContent` instead of `extractAndFormatText`
  console.log("post========>",post.fields.content);
  const formattedMarkdown = formatContent(post.fields.content);

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
        <ReactMarkdown>{formattedMarkdown}</ReactMarkdown>
      </div>
    </div>
  );
}
