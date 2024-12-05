import { useState } from "react";

import "./ChatSearch.css";

const ChatSearch = ({ onSearch }) => {
  const [search, setSearch] = useState("");

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    onSearch(value);
  };

  return (
    <div className="chat-search">
      <div className="input-wrapper">
        <span className="search-icon"></span>
        <input
          type="text"
          placeholder="Search chats"
          value={search}
          onChange={handleSearchChange}
          className="chat-search-input"
        />
      </div>
    </div>
  );
};

export default ChatSearch;
