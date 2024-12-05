import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import "./ChatWindow.css";

const socket = io("http://localhost:5001", { transports: ["websocket"] });

const ChatWindow = ({ activeChat }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const textAreaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeChat) {
      axios
        .get(`http://localhost:5001/messages?chatId=${activeChat._id}`, {
          withCredentials: true,
        })
        .then((res) => {
          setMessages((prevMessages) => ({
            ...prevMessages,
            [activeChat._id]: res.data,
          }));
        })
        .catch((err) => console.log("Error fetching messages", err));
    }

    const handleNewMessage = (message) => {
      setMessages((prevMessages) => {
        const chatMessages = prevMessages[message.chatId] || [];
        if (!chatMessages.some((msg) => msg._id === message._id)) {
          return {
            ...prevMessages,
            [message.chatId]: [...chatMessages, message],
          };
        }
        return prevMessages;
      });

      // if (message.chatId !== activeChat?._id && message.isBot) {
      //   setToast({
      //     text: message.text,
      //     firstName: message.chatFirstName,
      //     lastName: message.chatLastName,
      //   });
      // }
      if (message.chatId === activeChat?._id) {
        scrollToBottom();
      }
    };

    // Subscribe to new messages on WebSocket
    socket.on("newMessage", (message) => {
      console.log("Received new message from WebSocket:", message);
      handleNewMessage(message);
    });

    // Update messages when activeChat changes
    socket.on("messageUpdated", (updatedMessages) => {
      setMessages((prevMessages) => {
        const chatMessages = prevMessages[updatedMessages.chatId] || [];
        return {
          ...prevMessages,
          [updatedMessages.chatId]: chatMessages.map((msg) =>
            msg._id === updatedMessages._id ? updatedMessages : msg
          ),
        };
      });
    });

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageUpdated");
    };
  }, [activeChat]);

  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
    }
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    axios
      .post(
        "http://localhost:5001/messages",
        {
          chatId: activeChat._id,
          text,
        },
        { withCredentials: true }
      )
      .catch((err) => console.log("Error sending message", err));

    setText("");
    textAreaRef.current?.focus();
  };

  const handleEditMessage = (message) => {
    setEditingMessageId(message._id);
    setEditingText(message.text);
  };

  const handleSaveMessage = () => {
    if (editingMessageId) {
      axios
        .put(
          `http://localhost:5001/messages/${editingMessageId}`,
          {
            text: editingText,
          },
          { withCredentials: true }
        )
        .then(() => {
          setEditingMessageId(null);
          setEditingText("");
        })
        .catch((err) => console.log("Error updating message", err));
    }
  };

  const handleDeleteMessage = (message) => {
    axios
      .delete(`http://localhost:5001/messages/${message._id}`, {
        withCredentials: true,
      })
      .then(() => {
        setMessages((prevMessages) => {
          const chatMessages = prevMessages[message.chatId] || [];
          return {
            ...prevMessages,
            [message.chatId]: chatMessages.filter(
              (msg) => msg._id !== message._id
            ),
          };
        });
      })
      .catch((err) => console.log("Error deleting message", err));
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
      e.preventDefault();
    } else {
      setText(e.target.value);
    }
  };

  const allMessages = messages[activeChat?._id] || [];

  return (
    <div className="chat-window-main">
      <h2 className="chat-name-header">
        <img
          src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
          alt="profile"
        />
        {activeChat.firstName} {activeChat.lastName}
      </h2>
      <div className="messages-container">
        <ul>
          {allMessages.map((message) => (
            <li
              key={message._id}
              className={`message-item ${
                message.isBot ? "bot-message" : "user-message"
              }`}
            >
              {editingMessageId === message._id ? (
                <div className="message-bubble">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="edit-message-textarea"
                  />
                  <div className="message-actions">
                    <button
                      className="save-icon-button"
                      onClick={handleSaveMessage}
                    >
                      <img
                        src="https://static-00.iconduck.com/assets.00/save-icon-2048x2048-iovw4qr4.png"
                        alt="save"
                        className="save-icon"
                      />
                    </button>
                    <button
                      className="cancel-icon-button"
                      onClick={handleCancelEdit}
                    >
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/66/66847.png"
                        alt="cancel"
                        className="cancel-icon"
                      />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="message-wrapper">
                  <div className="message-bubble">
                    <span>{message.text}</span>
                    {!message.isBot && (
                      <div className="message-actions">
                        <button
                          className="edit-icon-button"
                          onClick={() => handleEditMessage(message)}
                        >
                          <img
                            src="https://cdn3.iconfinder.com/data/icons/feather-5/24/edit-512.png"
                            alt="edit"
                            className="edit-icon"
                          />
                        </button>
                        <button
                          className="delete-icon-button"
                          onClick={() => handleDeleteMessage(message)}
                        >
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png"
                            alt="edit"
                            className="delete-icon"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div ref={messagesEndRef}></div>
      </div>
      <div className="chat-input">
        <div className="textarea-container">
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message"
          />
          <span className="send-icon-button" onClick={sendMessage}>
            <img
              src="https://static-00.iconduck.com/assets.00/send-icon-2048x2020-jrvk5f1r.png"
              alt="Send"
            />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
