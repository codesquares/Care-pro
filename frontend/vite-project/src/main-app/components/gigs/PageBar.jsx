import React from "react";
import Button from "../button/Button";
import "./PageBar.scss";

const PageBar = ({ pages, currentPage, onPageClick, pageValidationStatus = {} }) => {
  const getPageIcon = (index) => {
    if (index < currentPage && pageValidationStatus[index]) {
      return <div className="page-bar-icon completed">&#10003;</div>; // Green tick for completed valid pages
    } else if (index < currentPage && !pageValidationStatus[index]) {
      return <div className="page-bar-icon error">&#10007;</div>; // Red X for completed invalid pages
    } else if (index === currentPage) {
      return <div className="page-bar-icon current">{index + 1}</div>; // Current page number
    } else {
      return <div className="page-bar-icon">{index + 1}</div>; // Future page number
    }
  };

  return (
<<<<<<< HEAD
    <div className="page-bar">
      <div className="page-bar-item">
        {pages.map((page, index) => (
          <div
            key={index}
            className="page-bar-item"
            onClick={() => {
              if (index <= currentPage) {
                onPageClick(index);
              }
            }}
            style={{ cursor: index <= currentPage ? "pointer" : "default" }}
          >
            {getPageIcon(index)}
            <div className={`page-bar-label ${index === currentPage ? "active" : ""}`}>
              {page}
            </div>
            {index < pages.length - 1 && <span className="page-bar-separator">{'>'}</span>}
          </div>
        ))}
      </div>
      <div className="page-bar-btn">
         {/* <Button>Save</Button> */}
=======
    <div className="page-bar-container">
      <div className="page-bar-card">
        <div className="page-bar-steps">
          {pages.map((page, index) => (
            <React.Fragment key={index}>
              <div
                className={`page-step ${index <= currentPage ? 'clickable' : ''} ${index === currentPage ? 'active' : ''}`}
                onClick={() => index <= currentPage && onPageClick(index)}
              >
                <div className={`step-number ${index < currentPage ? 'completed' : ''}`}>
                  {index < currentPage ? "✓" : index + 1}
                </div>
                <div className="step-name">{page}</div>
              </div>
              {index < pages.length - 1 && (
                <div className="step-separator">{'>'}</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="page-bar-actions">
          <Button className="save-button">Save</Button>
        </div>
>>>>>>> d3a8f7d97cb25569b4a5ab53a34841907a9b133b
      </div>
    </div>
  );
};

export default PageBar;