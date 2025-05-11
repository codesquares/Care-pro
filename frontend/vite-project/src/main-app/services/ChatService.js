/**
 * This file is kept for backward compatibility.
 * Please use the new implementation in features/messaging/utils/ChatService.js 
 */
import * as signalR from "@microsoft/signalr";
import config from "../config";

const API_URL = `https://carepro-api20241118153443.azurewebsites.net/chathub` // API URL

let connection = null;

export const connectToChat = (userToken, onMessageReceived) => {
    connection = new signalR.HubConnectionBuilder()
        .withUrl(API_URL, {
            accessTokenFactory: () => userToken // Pass JWT token for authentication
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    connection.start()
        .then(() => console.log("Connected to chat"))
        .catch(err => console.error("Connection failed: ", err));

    connection.on("ReceiveMessage", (senderId, message) => {
        console.log(`New message from ${senderId}: ${message}`);
        showNotification("New Message", message);
        onMessageReceived(senderId, message);
    });
};

export const sendMessage = async (senderId, receiverId, message) => {
    if (!connection) {
        console.error("Connection not established");
        return;
    }
    await connection.invoke("SendMessage", senderId, receiverId, message);
};

export const disconnectFromChat = () => {
    if (connection) {
        connection.stop();
        console.log("Disconnected from chat");
    }
};

// Function to show browser notifications
export const showNotification = (title, message) => {
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            new Notification(title, { body: message });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification(title, { body: message });
                }
            });
        }
    }
};
