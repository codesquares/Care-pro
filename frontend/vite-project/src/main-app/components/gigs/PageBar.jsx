import React from "react";
import "./pagebar.scss";
import Button from "../button/Button";

const PageBar = ({ pages, currentPage }) => {
  return (
    <div className="page-bar">
      <div className="page-bar-item">
        {pages.map((page, index) => (
          <div key={index} className="page-bar-item">
            {index <= currentPage ? (
              <div className="page-bar-icon completed">&#10003;</div> // Green tick
      
            ) : (
              <div className="page-bar-icon">{index + 1}</div> // Page number
            )}
            <div className={`page-bar-label ${index === currentPage ? "active" : ""}`}>
              {page}
            </div>
            {index < pages.length - 1 && <span className="page-bar-separator">{'>'}</span>}
          </div>
        ))}
      </div>
      <div className="page-bar-btn">
         <Button>Save</Button>
      </div>
    </div>
  );
};

export default PageBar;
