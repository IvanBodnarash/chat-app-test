import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import "./ChatList.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const socket = io(BACKEND_URL);

const ChatList = ({
  chats,
  setChats,
  setFilteredChats,
  activeChat,
  setActiveChat,
}) => {
  const [editingChat, setEditingChat] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/chats`, { withCredentials: true })
      .then((res) => setChats(res.data))
      .catch((err) => console.log("Error fetching chats", err));

    // Listen for new chat creation
    socket.on("chatCreated", (newChat) => {
      setChats((prevChats) => [...prevChats, newChat]);
      setFilteredChats((prevChats) => [...prevChats, newChat]);
    });

    // Listen for chat updates
    socket.on("chatUpdated", (updatedChat) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === updatedChat._id ? updatedChat : chat
        )
      );
      setFilteredChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === updatedChat._id ? updatedChat : chat
        )
      );
    });

    // Listen for chat deletion
    socket.on("chatDeleted", (deletedChatId) => {
      setChats((prevChats) =>
        prevChats.filter((chat) => chat._id !== deletedChatId)
      );
      setFilteredChats((prevChats) =>
        prevChats.filter((chat) => chat._id !== deletedChatId)
      );
      if (activeChat && activeChat._id === deletedChatId) {
        setActiveChat(null);
      }
    });

    return () => {
      socket.off("chatCreated");
      socket.off("chatUpdated");
      socket.off("chatDeleted");
    };
  }, [setChats, setFilteredChats, activeChat, setActiveChat]);

  const handleEdit = (chat) => {
    setEditingChat(chat._id);
    setEditFirstName(chat.firstName);
    setEditLastName(chat.lastName);
  };

  const handleUpdate = () => {
    axios
      .put(
        `${BACKEND_URL}/chats/${editingChat}`,
        {
          firstName: editFirstName,
          lastName: editLastName,
        },
        { withCredentials: true }
      )
      .then((res) => {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === editingChat
              ? { ...chat, firstName: editFirstName, lastName: editLastName }
              : chat
          )
        );
        setFilteredChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === editingChat
              ? { ...chat, firstName: editFirstName, lastName: editLastName }
              : chat
          )
        );
        setEditingChat(null);
      })
      .catch((err) => console.log("Error updating chat", err));
  };

  const handleCancelEdit = () => {
    setEditingChat(null);
    setEditFirstName("");
    setEditLastName("");
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      axios
        .delete(`${BACKEND_URL}/chats/${id}`, { withCredentials: true })
        .then(() => {
          setChats((prevChats) => prevChats.filter((chat) => chat._id !== id));
          setFilteredChats((prevChats) =>
            prevChats.filter((chat) => chat._id !== id)
          );
          setActiveChat(null);
        })
        .catch((err) => console.log("Error deleting chat", err));
    }
  };

  return (
    <div>
      <ul className="chat-list-container">
        {chats.map((chat) => (
          <li
            key={chat._id}
            className={`chat-list-item ${
              activeChat && activeChat._id === chat._id ? "active" : ""
            }`}
          >
            {editingChat === chat._id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First Name"
                />
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last Name"
                />
                <button className="save-button" onClick={handleUpdate}>
                  Save
                </button>
                <button className="cancel-button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            ) : (
              <div
                className="chat-list-item-container"
                onClick={() => setActiveChat(chat)}
              >
                <div className="chat-list-item-name">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/6522/6522516.png"
                    alt="avatar"
                  />
                  <span>
                    {chat.firstName} {chat.lastName}
                  </span>
                </div>
                <div className="chat-list-edit-buttons">
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(chat)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(chat._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;
