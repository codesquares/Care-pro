
// import Navbar from "../../../components/Navbar";
import "./ResolutionCenter.css";

const ResolutionCenter = () => {
    return (
      <div className="resolution-center-container">
        <div className="back-arrow">
          <span>←</span>
        </div>
  
        {/* FAQ Section */}
        <div className="faq-section">
          <h1>Frequently asked questions</h1>
          <p className="faq-description">
            This is where you can try to resolve order issues.
          </p>
  
          {/* Chat Support Section */}
          <div className="chat-support">
            <img
              src="https://via.placeholder.com/60"
              alt="Chat Icon"
              className="chat-icon"
            />
            <p>
              If you have an issue with an order in progress or a completed order,
              our Customer Support team is available to assist you.
            </p>
            <button className="chat-support-btn">Chat Support Teams</button>
          </div>
        </div>
  
        {/* Support Section */}
        <div className="support-section">
          <h2>Support</h2>
          <div className="support-item">
            <div className="support-item-content">
                <img
                src="https://via.placeholder.com/60"
                alt="support Icon"
                className="support-icon"
                />
                <div className="support-text-wrapper">
                    <span className="support-text">FAQs</span>
                    <span className="support-subtext">Find needed answers.</span>
                </div>
              
            </div>
            <span className="arrow">→</span>
          </div>
        </div>
      </div>
    );
  };
  
  export default ResolutionCenter;