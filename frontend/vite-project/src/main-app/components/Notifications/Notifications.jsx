import React, { useState } from "react";
import "../../components/gigs/gigs.scss";
import careproLogoWhite from "../../../assets/careproLogoWhite.svg";

const Notifications = () => {
  return (
    <div className="main-container">
      <style jsx>{`
        .main-container {
          display: flex;
        }
        /* Couldnt find a pre-existing sidebar so i made one so i could set up the notifications page */
        .sidebar {
          width: 20%;
          background-color: #25435D;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        /* Styling for the image in the sidebar */
        .sidebar img {
          width: 150px;
          margin-bottom: 20px;
        }
        /* Styling for the buttons in the sidebar */
        .sidebar-button {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: none;
          border-radius: 20px;
          background-color: #36556E;
          color: white;
          cursor: pointer;
          text-align: center;
        }

        .sidebar-button:hover {
          background-color: #758E9D;
        }
        /* Styling for the support box in the sidebar */
        .support-box {
          width: 100%;
          padding: 20px;
          margin-top: auto;
          border-radius: 20px;
          background-color: #36556E;
          color: white;
          text-align: center;
        }

        .support-box p {
          color: white;
        }

        .support-button {
          width: 100%;
          padding: 10px;
          margin-top: 10px;
          border: none;
          border-radius: 20px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          text-align: center;
        }

        .support-button:hover {
          background-color: #0056b3;
        }
        /* Styling for the hello text */
        .header {
          font-family: PoppinsSemiBold, sans-serif;
          font-size: 32px;
          font-weight: bold;
          color: #02445F;
          margin-left: 20px;
        }
        /* Styling for the notifications header */
        .notifications-header {
          font-family: PoppinsSemiBold, sans-serif;
          font-size: 24px;
          font-weight: bold;
          color: #000000;
          margin-left: 44px;
        }
        /* Styling for the notifications box */
        .notifications-box {
          background-color: #f4f4f4;
          border-radius: 20px;
          padding: 20px;
          margin: 20px 44px;
        }
        /* Styling for each notification entry */
        .notification-entry {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          background-color: #F1FAFF;
          border-radius: 10px;
          padding: 10px;
        }
        /* Sets the image sizes for the notification */
        .notification-entry img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          margin-right: 10px;
        }

        .notification-entry p {
          margin: 0;
          font-family: Poppins, sans-serif;
          font-size: 16px;
          color: #333;
        }
      `}</style>
      <div className="sidebar">
        <img src={careproLogoWhite} alt="CarePro Logo" />
        <button className="sidebar-button">Dashboard</button>
        <button className="sidebar-button">Appointments</button>
        <button className="sidebar-button">Messages</button>
        <button className="sidebar-button">Profile</button>
        <div className="support-box">
          <p>Support</p>
          <p>Have an issue or need assistance? Chat with our support team now!</p>
          <button className="support-button">Chat Support →</button>
        </div>
      </div>
      <div>
        <h1 className="header">Hi User! 👋</h1>
        <h2 className="notifications-header">Notifications</h2>
        <div className="notifications-box">
          <div className="notification-entry">
            <img src="https://via.placeholder.com/50" alt="Notification" />
            <p>Notification 1: This is a sample notification text.</p>
          </div>
          <div className="notification-entry">
            <img src="https://via.placeholder.com/50" alt="Notification" />
            <p>Notification 2: This is another sample notification text.</p>
          </div>
          <div className="notification-entry">
            <img src="https://via.placeholder.com/50" alt="Notification" />
            <p>Notification 3: This is yet another sample notification text.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;