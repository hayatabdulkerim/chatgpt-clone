import express from "express";
import {
  createConversationController,
  getConversationsController,
} from "./controller/chat.controller.js";
const chatRouter = express.Router();

// api/chat/conversations

chatRouter.post("/conversations", createConversationController); // api end points (aka route handlers which are middlewares internaly)
chatRouter.get("/conversations", getConversationsController); 

export default chatRouter;
