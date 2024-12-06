import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import NewChatModal from "./components/NewChatModal";
import ChatSearch from "./components/ChatSearch";

import Toast from "./components/Toast";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://chat-app-test-cllw.onrender.com";
const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

console.log("BACKEND_URL:", BACKEND_URL);

const App = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [autoMessages, setAutoMessages] = useState(false);

  const [user, setUser] = useState(null);

  const [globalToast, setGlobalToast] = useState(null);

  // Auth check
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/auth/profile`, { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch((error) => console.error("Error fetching user:", error));
  }, []);

  const handleLogout = () => {
    axios
      .get(`${BACKEND_URL}/auth/logout`, { withCredentials: true })
      .then(() => {
        setUser(null);
      })
      .catch((error) => console.error("Error logging out:", error));
  };

  const handleChatCreated = (newChat) => {
    setChats((prevChats) => [...prevChats, newChat]);
    setFilteredChats((prevChats) => [...prevChats, newChat]);
  };

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/chats`, { withCredentials: true })
      .then((res) => {
        setChats(res.data);
        setFilteredChats(res.data);
      })
      .catch((error) => console.error("Error fetching chats:", error));
  }, []);

  // Handle WebSocket events
  useEffect(() => {
    const handleBotMessage = (data) => {
      console.log("Received botMessage: ", data);
      // Show toast only if the message is for a different chat
      if (!activeChat || activeChat._id !== data.chatId) {
        setGlobalToast({
          text: data.text,
          firstName: data.chatName.split(" ")[0],
          lastName: data.chatName.split(" ")[1],
        });
      }
    };

    const handleChatUpdated = (updatedChat) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === updatedChat._id ? updatedChat : chat
        )
      );
    };

    socket.on("botMessage", handleBotMessage);
    socket.on("chatUpdated", handleChatUpdated);

    return () => {
      socket.off("botMessage", handleBotMessage);
      socket.off("chatUpdated", handleChatUpdated);
    };
  }, [activeChat]);

  const toggleAutoMessages = () => {
    if (autoMessages) {
      socket.emit("stopAutoMessages");
      console.log("Auto-generated messages stopped.");
    } else {
      socket.emit("startAutoMessages");
      console.log("Auto-generated messages started.");
    }
    setAutoMessages((prevAutoMessages) => !prevAutoMessages);
  };

  const handleSearch = (query) => {
    if (!query) {
      setFilteredChats(chats);
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = chats.filter(
        (chat) =>
          chat.firstName.toLowerCase().includes(lowerCaseQuery) ||
          chat.lastName.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredChats(filtered);
    }
  };

  return (
    <div className="app">
      <div className="chat-sidebar">
        <div className="chat-sidebar-content">
          <header>
            {user ? (
              <>
                <div className="main-header-container">
                  <div className="avatar">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png"
                      alt={user.displayName}
                    />
                  </div>
                  <div className="inner-header-container">
                    <p>Welcome, {user.displayName}</p>
                    <button
                      className="google-logout-button"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
                <div className="header-search-auto-btn-container">
                  <ChatSearch onSearch={handleSearch} />
                  <button
                    onClick={toggleAutoMessages}
                    disabled={chats.length === 0}
                    className="auto-messages-button"
                  >
                    {autoMessages
                      ? "Stop Auto Messages"
                      : "Start Auto Messages"}
                  </button>
                </div>
              </>
            ) : (
              <a href={`${BACKEND_URL}/auth/google`}>
                <button className="google-login-button">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png"
                    alt="Google logo"
                  />
                  Login with Google
                </button>
              </a>
            )}
          </header>
          <div className="chat-list">
            <div className="chat-list-header">
              <p>Chats</p>
              <button
                className="new-chat-button"
                onClick={() => setIsModalOpen(true)}
                disabled={!user}
              >
                New Chat
              </button>
            </div>
            <div className="chat-list-ul-wrapper">
              <ChatList
                chats={filteredChats}
                setChats={setChats}
                setFilteredChats={setFilteredChats}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="chat-window">
        {activeChat ? (
          <ChatWindow activeChat={activeChat} />
        ) : (
          <div className="no-chat-selected">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {isModalOpen && (
        <div>
          <div
            className="modal-overlay"
            onClick={() => setIsModalOpen(false)}
          />
          <NewChatModal
            closeModal={() => setIsModalOpen(false)}
            onChatCreated={handleChatCreated}
          />
        </div>
      )}

      {globalToast && (
        <Toast
          firstName={globalToast.firstName}
          lastName={globalToast.lastName}
          message={globalToast.text}
          onClose={() => setGlobalToast(null)}
        />
      )}
    </div>
  );
};

export default App;
