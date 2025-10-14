import React, { Fragment } from "react";
import "./pagebar.scss";

const PageBar = ({ pages, currentPage, onPageClick, pageValidationStatus = {} }) => {
  const getStepClasses = (index) => {
    const baseClasses = ['page-step'];
    
    if (index <= currentPage) baseClasses.push('clickable');
    if (index === currentPage) baseClasses.push('active');
    if (index < currentPage && pageValidationStatus[index]) baseClasses.push('completed-valid');
    if (index < currentPage && !pageValidationStatus[index]) baseClasses.push('completed-invalid');
    
    return baseClasses.join(' ');
  };

  const getStepContent = (index) => {
    if (index < currentPage && pageValidationStatus[index]) {
      return "✓"; // Valid completed page
    } else if (index < currentPage && !pageValidationStatus[index]) {
      return "✗"; // Invalid completed page
    } else {
      return index + 1; // Current or future page number
    }
  };

  return (
    <div className="page-bar-container">
      <div className="page-bar-card">
        <div className="page-bar-steps">
          {pages.map((page, index) => (
            <Fragment key={index}>
              <div
                className={getStepClasses(index)}
                onClick={() => index <= currentPage && onPageClick(index)}
              >
                <div className="step-number">
                  {getStepContent(index)}
                </div>
                <div className="step-name">{page}</div>
              </div>
              {index < pages.length - 1 && (
                <div className="step-separator">{'>'}</div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageBar;