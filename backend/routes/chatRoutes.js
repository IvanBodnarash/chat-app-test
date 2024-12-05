import { Router } from "express";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

const router = Router();

// Get all chats
router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find();
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new chat
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const chat = new Chat({ firstName, lastName });
    await chat.save();
    res.status(201).json(chat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a chat by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName } = req.body;
    const chat = await Chat.findByIdAndUpdate(id, { firstName, lastName }, { new: true });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    res.json(chat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a chat by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chat = await Chat.findByIdAndDelete(id);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Delete all messages associated with the chat
    await Message.deleteMany({ chatId: id });
    
    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;