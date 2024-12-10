import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import passport from "passport";
import { connect } from "mongoose";
import cors from "cors";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import passportSocketIo from "passport.socketio";

import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import { isAuthenticated } from "./middleware/authMiddleware.js";
import Chat from "./models/Chat.js";
import Message from "./models/Message.js";
import fetch from "node-fetch";
import https from "https";

const agent = new https.Agent({ rejectUnauthorized: false });

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

// MongoDB session store
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGODB_URI,
});

let autoMessageInterval = null;
let isAutoMessagesRunning = false;

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);  
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());

// Use session in WebSockets
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "connect.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    success: (data, accept) => {
      console.log("WebSocket session established:", data);
      accept(null, true);
    },
    fail: (data, message, error, accept) => {
      console.error("WebSocket session failed. Reason:", message);
      console.error("Headers received:", data.headers);
      accept(null, false);
    },
  })
);

// Routes
app.use("/auth", authRoutes);
app.use("/chats", isAuthenticated, chatRoutes);
app.use("/messages", isAuthenticated, messageRoutes(io));

app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  console.log("Session Data:", req.session);
  console.log("Session in middleware:", req.session);
  console.log("User in middleware:", req.user);
  next();
});

app.get("/", (req, res) => {
  res.send("WebSocket server is running!");
});

// Websocket logic
io.on("connection", (socket) => {
  console.log("New WebSocket connection");
  console.log("Session ID:", socket.request.sessionID);
  // Start auto-generated messages
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
        const quoteRsponse = await fetch("https://api.quotable.io/random", {
          agent,
        });
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

// console.log("MONGODB_URI:", process.env.MONGODB_URI);

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
