
import './messageInput.scss';

const MessageInput = ({ message, setMessage, onSendMessage, onKeyPress, placeholder = "Type a message..." }) => {
  return (
    <div className="message-input-container">
      <div className="message-input-actions">
        <button className="input-action-button" title="Attach file">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
      </div>
      
      <div className="message-input-field">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder={placeholder}
          rows={1}
          className="input-field"
        />
      </div>
      
      <div className="message-input-send">
        <button 
          className="send-button"
          onClick={onSendMessage}
          disabled={!message.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;