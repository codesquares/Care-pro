import React, { useState } from "react";
import story4 from "../assets/story4.png";
import story5 from "../assets/story5.png";
import arrow from "../assets/arrow-right.svg"; 
import expandIcon from "../assets/ExpandIcon .png"
import "../styles/components/ourBlogs.scss";

const OurBlogs = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const blogs = [
    {
      title: "Balancing Work and Caregiving Strategies for Success",
      description:
        "Explore ways caregivers can effectively juggle their professional responsibilities with caregiving duties.",
      image: story4, // Add image for the blog
    },
    {
      title: "The Importance of Self-Care for Caregivers",
      description:
        "Emphasize the need for caregivers to prioritize their physical and mental health, offering self-care tips.",
      image: story5, // Add image for the blog
    },
    {
      title: "Understanding Dementia: A Caregiver's Perspective",
      description:
        "Break down the stages of dementia, offering insights into caregiving approaches, communication tips.",
      image: story4, // Add image for the blog
    },
  ];

  const openModal = (blog) => {
    setSelectedBlog(blog);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBlog(null);
  };

  return (
    <section className="our-blogs">
      <h2>Our Blogs</h2>
      <p className="subtitle">Read our blogs tailored to helping caregivers</p>

      <div className="blogs-container">
        {blogs.map((blog, index) => (
          <div className="blog-item" key={index}>
            <div className="image-container" onClick={() => openModal(blog)}>
              <img src={blog.image} alt={blog.title} className="blog-image" />
              <div className="overlay">
                <img src={expandIcon} alt="Expand" className="expand-icon" />
              </div>
            </div>
            <h3>{blog.title}</h3>
            <p>{blog.description}</p>
          </div>
        ))}
      </div>

      <div className="view-all-container">
        <button className="view-all-button">
          View All Blogs
          <img src={arrow} alt="arrow" style={{ marginLeft: '0.5rem' }} />
        </button>
      </div>

      {/* Modal for displaying the full-screen image and text */}
      {isModalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedBlog.image} alt={selectedBlog.title} className="modal-image" />
            <h3>{selectedBlog.title}</h3>
            <p>{selectedBlog.description}</p>
            <button className="close-button" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default OurBlogs;