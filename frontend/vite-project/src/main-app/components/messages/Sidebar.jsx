// Sidebar.js
import React from 'react';
import './sidebar.scss';

// const Sidebar = ({ conversations, onSelectChat }) => {
//   return (
//     <div className="sidebar">
//       <input type="text" placeholder="Search or type in keyword" className="search-bar" />
//       <button className="All-chats-button">All Chats
//       <span className="chat-bar-separator"> &#129171;</span>
//       </button>
//       <ul className="chat-list">
//         {conversations.map((chat) => (
//           <li key={chat.id} className="chat-item" onClick={() => onSelectChat(chat.id)}>
//             <img src={chat.avatar} alt={chat.name} className="avatar" />
//             <div className="chat-preview">
//               <h4>{chat.name}</h4>
//               <p>{chat.previewMessage}</p>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default Sidebar;
const Sidebar = ({ conversations, onSelectChat }) => {
  return (
    <div className="sidebar">
      <input type="text" placeholder="Search or type in keyword" className="search-bar" />
      <ul className="chat-list">
        {conversations.map((chat) => (
          <li key={chat.id} className="chat-item" onClick={() => onSelectChat(chat.id)}>
            <img src={chat.avatar} alt={chat.name} className="avatar" />
            <div className="chat-preview">
              <h4>{chat.name}</h4>
              <p>{chat.previewMessage}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
