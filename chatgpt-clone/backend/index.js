import 'dotenv/config'  //we need to import this here so that we can use environment variables in the backend
import express from "express";
import db from "./db/db.config.js";
import mainRouter from './src/api/main.routes.js';
import { errorHandler } from './src/middleware/error-handler.js';
const app = express();

app.use(express.json()) // middleware for parsing request body (since we put this middleware befor the routes all requests comming to routes starting with /api will pass through this middleware before reaching the routes )
app.use('/api' , mainRouter)  // a middleware for routes that start with /api

app.use(errorHandler)  // this is an error handler middleware we put it at the end so that errors can get to it

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release()
    console.log("Db connected");

    app.listen(3888, (err) => {
      if (err) {
        throw err;
      }
      console.log("Server is running on port http://localhost:3888");
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();
