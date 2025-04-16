// import React from "react";
// import { useNavigate } from "react-router-dom";
// import "../care-giver/care-giver-dashboard/NavigationBar.css";
// import { FaSearch, FaUser, FaShoppingCart } from "react-icons/fa";
// import logo from '../../../assets/careproLogo.svg';

// const ClientNavBar = () => {
//   const navigate = useNavigate();
//   const basePath = "/app/client"; // Base path for your routes

//   //get the user name from local storage
//   const user = JSON.parse(localStorage.getItem("userDetails"));
//   const userName = user?.firstName
//     ? `${user.firstName} ${user.lastName}`
//     : "";

//   // Function to generate initials from the name
//   const getInitials = (name) => {
//     const names = name.split(" ");
//     const initials = names.map((n) => n[0].toUpperCase()).join("");
//     return initials.slice(0, 2); // Get the first two initials
//   };

//   return (
//     <nav className="navigation-bar">
//       <div className="logo" onClick={() => navigate(`${basePath}/dashboard`)}>
//         <img src={logo} alt="CarePro Logo" />
//       </div>
//       <div className="search-bar">
//               <FaSearch size={20} />
//               <input type="text" placeholder="What are you looking for today?" />
//             </div>
//             <div className="icons">
//               <FaShoppingCart size={20} />
//               <FaUser size={20} />
//             </div>
//       <div className="nav-actions">
//         <button
//           className="view-orders"
//           onClick={() => navigate(`${basePath}/my-order`)}
//         >
//           View Orders
//         </button>
//         {/* <div className="earnings"  onClick={() => navigate(`${basePath}/earnings`)}>
//           <span>Earned:</span>
//           <strong>₦300,000.00</strong>
//         </div> */}
//         <div
//           className="profile-avatar"
//           // onClick={() => navigate(`${basePath}/profile`)}
//         >
//           <span>{userName}</span>
//           {/* Avatar with initials */}
//           <div className="avatar">{getInitials(userName)}</div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default ClientNavBar;


import React from "react";
import { useNavigate } from "react-router-dom";
import logo from '../../../assets/careproLogo.svg';
import hear from "../../../assets/main-app/heart.svg";
import bell from "../../../assets/main-app/notification-bing.svg";
import message from "../../../assets/main-app/message.svg";
import receipt from "../../../assets/main-app/receipt.svg";
import "../care-giver/care-giver-dashboard/NavigationBar.css";

const ClientNavBar = () => {
  const navigate = useNavigate();
  const basePath = "/app/client";;

  const user = JSON.parse(localStorage.getItem("userDetails"));
  const userName = user?.firstName ? `${user.firstName} ${user.lastName}` : "";

  const getInitials = (name) => {
    const names = name.split(" ");
    const initials = names.map((n) => n[0].toUpperCase()).join("");
    return initials.slice(0, 2);
  };

  const IconLink = ({ to, icon, alt }) => (
    <li className="nav-link icon-link" onClick={() => navigate(to)}>
      <img src={icon} alt={alt} />
    </li>
  );

  return (
    <nav className="navigation-bar">
      <div className="logo" onClick={() => navigate(`${basePath}/dashboard`)}>
        <img src={logo} alt="CarePro Logo" />
      </div>

      {/* <ul className="nav-links">
        <li className="nav-link text-link" onClick={() => navigate(`${basePath}/dashboard`)}>
          Dashboard
        </li>
        <li className="nav-link text-link" onClick={() => navigate(`${basePath}/settings`)}>
          Settings
        </li>
      </ul> */}
      <ul className="nav-icons">
  <IconLink to={`${basePath}/notifications`} icon={bell} alt="Notifications" />
  <IconLink to={`${basePath}/messages`} icon={message} alt="Messages" />
  <IconLink to={`${basePath}/favorites`} icon={hear} alt="Favorites" />
</ul>

      <div className="nav-actions">
        <div className="earnings" onClick={() => navigate(`${basePath}/my-order`)}>
          <img src={receipt} alt="Earnings Icon" />
          {/* <span>Earned:</span> */}
          <strong>View Order</strong>
        </div>

        <div className="profile-avatar" onClick={() => navigate(`${basePath}/profile`)}>
          <span>{userName}</span>
          <div className="avatar">{getInitials(userName)}</div>
        </div>
      </div>
    </nav>
  );
};

export default ClientNavBar;

