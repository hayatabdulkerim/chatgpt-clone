import express from "express";
import chatRouter from "./chat/chat.routes.js";
const mainRouter = express.Router();



// /api/chat
mainRouter.use("/chat", chatRouter);  // a middleware for routes that start with /api/chat

export default mainRouter;
