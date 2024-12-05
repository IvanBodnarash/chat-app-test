import { Schema, model } from "mongoose";

const ChatSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
});

export default model("Chat", ChatSchema);