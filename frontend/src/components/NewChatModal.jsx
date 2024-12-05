import { useState, useEffect } from "react";
import axios from "axios";

import "./NewChatModal.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NewChatModal = ({ closeModal, onChatCreated }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => closeModal(), 500);
  };
  const createChat = () => {
    if (!firstName.trim() || !lastName.trim()) return;

    axios
      .post(
        `${BACKEND_URL}/chats`,
        { firstName, lastName },
        { withCredentials: true }
      )
      .then((res) => {
        console.log("Chat created:", res.data);
        onChatCreated(res.data);
        closeModal();
      })
      .catch((err) => console.log("Error creating chat", err));
  };

  return (
    <div
      className={`modal-overlay ${isVisible ? "active" : ""}`}
      onClick={(e) => {
        if (e.target.classList.contains("modal-overlay")) handleClose();
      }}
    >
      <div className="modal">
        <h2>Create New Chat</h2>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <div>
          <button onClick={createChat}>Create</button>
          <button onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
