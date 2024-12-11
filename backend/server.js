import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
// import session from "express-session";
import { connect } from "mongoose";
import cors from "cors";
// import MongoStore from "connect-mongo";
import fetch from "node-fetch";

import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import Chat from "./models/Chat.js";
import Message from "./models/Message.js";


dotenv.config();

console.log("NODE_ENV:", process.env.NODE_ENV);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let autoMessageInterval = null;
let isAutoMessagesRunning = false;

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//       secure: true,
//       httpOnly: true,
//       sameSite: "none",
//       maxAge: 24 * 60 * 60 * 1000,
//     },
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGODB_URI,
//     }),
//   })
// );

// Routes
app.use("/chats", chatRoutes);
app.use("/messages", messageRoutes(io));

app.get("/", (req, res) => {
  res.send("WebSocket server is running!");
});

// Websocket logic
io.on("connection", (socket) => {
  socket.on("startAutoMessages", async () => {
    if (isAutoMessagesRunning) {
      console.log("Auto-generated messages are already running.");
      return;
    }
    isAutoMessagesRunning = true;

    autoMessageInterval = setInterval(async () => {
      try {
        const chats = await Chat.find();
        if (chats.length === 0) return;

        const randomChat = chats[Math.floor(Math.random() * chats.length)];

        // Get random quote from Quotable
        const quoteRsponse = await fetch("https://api.quotable.io/random");
        const quote = await quoteRsponse.json();

        const randomMessage = `Auto-generated message: "${quote.content}" - ${quote.author}`;

        const message = new Message({
          chatId: randomChat._id,
          text: randomMessage,
          isBot: true,
          timestamp: new Date(),
        });

        await message.save();

        // Event emmission through socket.io for user message
        io.emit("newMessage", {
          ...message.toObject(),
          chatFirstName: randomChat.firstName,
          chatLastName: randomChat.lastName,
        });

        // Event emmission through socket.io for bot message
        io.emit("botMessage", {
          chatId: randomChat._id,
          chatName: `${randomChat.firstName} ${randomChat.lastName}`,
          text: randomMessage,
        });
      } catch (error) {
        console.error("Error sending auto-generated message:", error);
      }
    }, 5000);
  });

  // Stop auto-generated messages
  socket.on("stopAutoMessages", () => {
    if (autoMessageInterval) {
      clearInterval(autoMessageInterval);
      autoMessageInterval = null;
      isAutoMessagesRunning = false;
      console.log("Auto-generated messages stopped.");
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  // Testing
  socket.on("test", (msg) => {
    console.log("Message received: ", msg);
    io.emit("response", "Hello from server!");
  });
});

// Connect to MongoDB
connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
