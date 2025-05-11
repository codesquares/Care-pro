
# 💬 Real-Time Messaging and Notification System - CarePro

## 📌 Overview
This document outlines the product requirements, architecture, user stories, and current implementation status for the **real-time messaging and notification system** between caregivers and clients on the CarePro platform.

---

## 🧑‍💻 User Stories

### Messaging
- **US001** - As a **client**, I want to see a list of caregivers I have chatted with.
- **US002** - As a **caregiver**, I want to see a list of clients I have chatted with.
- **US003** - As a **user**, I want to click a name to start/resume a chat conversation.
- **US004** - As a **user**, I want to send and receive messages in real-time.
- **US005** - As a **user**, I want to see past messages when I reopen a chat.

### Notifications
- **US006** - As a **user**, I want to receive a visual notification when a new message arrives.
- **US007** - As a **user**, I want to be notified of unread messages when I’m not in the chat area.

---

## 🏗️ Architecture Overview

### 🔁 Backend to Frontend Communication
- **SignalR** is used for real-time bidirectional communication between users (caregivers and clients).
- **REST API** is used for fetching user lists and message history.

### 📞 SignalR Flow
1. Frontend connects to `/chathub` via SignalR.
2. Backend listens for `SendMessage` events and broadcasts to the appropriate user.
3. Incoming messages are handled in the frontend and appended to the current chat view.

---

## 🔧 Technology Stack

### Backend (ASP.NET Core Web API)
- .NET 7 / .NET 8
- SignalR for real-time messaging
- Entity Framework Core (EF Core)
- Azure App Service for hosting
- CORS setup for frontend integration
- JWT-based Authentication

### Frontend (React)
- React 18
- Axios for REST API calls
- SignalR JS Client (`@microsoft/signalr`)
- SCSS for styling

---

## 📂 Current File Structure (Frontend)

```
/src
 ├── components/messages
 │   ├── Sidebar.jsx            // Lists all users you’ve chatted with
 │   ├── ChatArea.jsx           // The messaging window with live messages
 ├── pages
 │   └── Messages.jsx           // Main wrapper that connects Sidebar & ChatArea
 ├── services
 │   └── ChatService.js         // SignalR logic: connect, send, receive
 ├── utilities
 │   └── data.js                // Initially used for static mock data
 └── styles/main-app/pages/Messages.scss
```

---

## 📂 Backend Endpoints Implemented

### 🔹 SignalR Hub
- **Route**: `/chathub`
- **Class**: `ChatHub : Hub`
- **Functionality**: Handles `SendMessage`, `ReceiveMessage`, user connection

### 🔹 Chat Controller Endpoints
- `GET /api/chat/users/{userId}` → Gets users this user has chatted with
- `GET /api/chat/messages?user1={id1}&user2={id2}` → Fetches message history

---

## ✅ What Has Been Implemented
### Frontend
- SignalR integration with reconnect support
- `Sidebar` for chat contacts (now fetches dynamically)
- `ChatArea` for message UI
- Dynamic loading of messages between selected users
- Messaging component is fully responsive

### Backend
- SignalR setup (`ChatHub`)
- Controller and service layer for chat messaging
- JWT-authenticated message sending
- Message persistence in database (assumed via EF Core)

---

## 🔜 What’s Left to Implement
### Frontend
- [ ] Toast or visual notifications for new messages (when not viewing chat)
- [ ] Indicate unread messages
- [ ] Online/offline presence indicators
- [ ] Message delivery/read status (optional)

### Backend
- [ ] Push notifications support (if mobile app involved)
- [ ] Message read receipts and status update logic
- [ ] Rate limiting / abuse protection for message spamming

---

## 🔗 API & SignalR Endpoint Reference

url: https://carepro-api20241118153443.azurewebsites.net
| Type       | Endpoint                                          | Description                             |
|------------|---------------------------------------------------|-----------------------------------------|
| REST API   | `GET /api/chat/history`                   | List of past chat users                 |
| REST API   | `GET /api/chat/chatPreview`       | Full message history                    |
| SignalR    | `/chathub`                                       | Main SignalR connection endpoint       |

---

## 🧠 Notes
- Make sure that the frontend does not use `/api/chathub` for SignalR – it should be `/chathub`.
- CORS must allow frontend domain (e.g., localhost:3000 or your deployed frontend)
- The `ChatHub` should be excluded from `[Authorize]` if you want unauthenticated users to chat.

---

## 🏁 Conclusion
This messaging system lays the foundation for a fully functional live chat between caregivers and clients. By completing the remaining features (especially notifications and message status), you will create a seamless communication experience.

> ✅ Feel free to share this document with your team or save it to your documentation system!
