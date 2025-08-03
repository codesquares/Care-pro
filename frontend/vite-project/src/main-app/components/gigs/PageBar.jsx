import React from "react";
import "./pagebar.scss";
import Button from "../button/Button";

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
      </div>
    </div>
  );
};

export default PageBar;
