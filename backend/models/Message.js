import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    text: { type: String, required: true },
    isBot: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
});

export default model("Message", MessageSchema);