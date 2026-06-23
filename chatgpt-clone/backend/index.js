import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db/db.config.js";
import mainRouter from "./src/api/main.routes.js";
import { errorHandler } from "./src/middleware/error-handler.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", mainRouter);
app.use(errorHandler);

async function startServer() {
  try {
    // PostgreSQL health check (replaces mysql getConnection)
    await db.query("SELECT 1");

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
