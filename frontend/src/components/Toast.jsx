import { useEffect, useState } from "react";
import "./Toast.css";

const Toast = ({ firstName, lastName, message, onClose }) => {
  const [visible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose();
      }, 500);
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${visible ? "fade-in" : "fade-out"}`}>
      <h3>
        {firstName} {lastName}
      </h3>
      <p className="toast-message">{message}</p>
      <button className="toast-close-button" onClick={onClose}>
        X
      </button>
    </div>
  );
};

export default Toast;
