import React from "react";
import Button from "../button/Button";
import "./PageBar.scss";

const PageBar = ({ pages, currentPage, onPageClick }) => {
  return (
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
      </div>
    </div>
  );
};

export default PageBar;