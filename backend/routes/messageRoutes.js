import { Router } from "express";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import fetch from "node-fetch";

// Temporary agent for ignoring SSL
import https from "https";
const agent = new https.Agent({ rejectUnauthorized: false });

const router = Router();

export default (io) => {
  // Get all messages for chat
  router.get("/", async (req, res) => {
    try {
      const { chatId } = req.query;
      const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Send a message
  router.post("/", async (req, res) => {
    try {
      const { chatId, text } = req.body;

      // Save the message from the user
      const userMessage = new Message({
        chatId,
        text,
        isBot: false,
        timestamp: new Date(),
      });
      await userMessage.save();

      //Event emmission through socket.io for user message
      io.emit("newMessage", userMessage);

      res.status(201).json(userMessage);

      // Get random quote from Quotable
      const quoteRsponse = await fetch("https://api.quotable.io/random", {
        agent,
      });
      const quote = await quoteRsponse.json();

      // Get chat details
      const chat = await Chat.findById(chatId);

      const botMessage = new Message({
        chatId,
        text: `"${quote.content}" - ${quote.author}`,
        isBot: true,
        chatFirstName: chat.firstName,
        chatLastName: chat.lastName,
        timestamp: new Date(),
      });

      setTimeout(async () => {
        await botMessage.save();
        io.emit("newMessage", {
          ...botMessage.toObject(),
          chatFirstName: chat.firstName,
          chatLastName: chat.lastName,
        });
      }, 3000);
    } catch (err) {
      // Catch block is only for user message creation errors
      console.error(err);
      if (!res.headersSent) {
        res.status(400).json({ message: err.message });
      }
    }
  });

  // Update a message by ID
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      const updatedMessage = await Message.findByIdAndUpdate(
        id,
        { text },
        { new: true }
      );

      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      io.emit("messageUpdated", updatedMessage);

      res.status(200).json(updatedMessage);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update the message" });
    }
  });

  // Delete a message by ID
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedMessage = await Message.findByIdAndDelete(id);
      if (!deletedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      io.emit("messageDeleted", deletedMessage);

      res.status(200).json({ message: "Message deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete the message" });
    }
  });

  return router;
};
