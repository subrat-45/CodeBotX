import "dotenv/config.js";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./Models/projectModel.js";
import { generateResult } from "./Services/aiService.js";
import dbConneect from "./DB/db.js";

const port = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://codebotx-frontend.onrender.com'
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];
    const projectId = socket.handshake.query.projectId;
    
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid project id"));
    }

    socket.project = await projectModel.findById(projectId);

    if (!socket.project) {
      return next(new Error("Project not found"));
    }

    if (!token) {
      return next(new Error("User not Authorize"));
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);

    if (!decode) {
      return next(new Error("User not Authorize"));
    }

    socket.user = decode;

    next();
  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {
  console.log("A user connected!", socket.user?.email);

  const { projectId } = socket.handshake.query;
  if (projectId) {
    socket.join(projectId);
    console.log(`User ${socket.user?.email} joined project: ${projectId}`);
  }

  socket.on("project-message", async (data) => {
    try {
      const message = data.message;
      const sender = data.sender;

      // Validate message
      if (!message || typeof message !== 'string') {
        throw new Error("Invalid message format");
      }

      // Broadcast user message to ALL users in the room (including sender)
      io.to(projectId).emit("project-message", {
        message: message,
        sender: sender,
        type: "user"
      });

      // Check if AI is mentioned
      const aiIsPresentInMessage = message.toLowerCase().includes("@ai");

      if (aiIsPresentInMessage) {
        // Remove @ai and get the actual prompt
        const prompt = message.replace(/@ai/gi, "").trim();
        
        if (!prompt) {
          io.to(projectId).emit("project-message", {
            message: {
              text: "Please provide a question or request after @ai"
            },
            sender: {
              _id: "ai",
              email: "AI Assistant",
            },
            type: "ai"
          });
          return;
        }

        console.log(`AI Request from ${sender.email}: ${prompt}`);
        
        // Send typing indicator
        io.to(projectId).emit("ai-typing", { isTyping: true });
        
        try {
          // Generate AI response
          const result = await generateResult(prompt);
          
          // Parse the AI result
          let parsedResult;
          try {
            parsedResult = JSON.parse(result);
          } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            console.error("Raw result:", result.substring(0, 500));
            
            // If parsing fails, wrap in text response
            parsedResult = { 
              text: result,
              error: true,
              details: "Response was not in valid JSON format"
            };
          }

          // Validate the structure
          if (!parsedResult.text && !parsedResult.fileTree) {
            throw new Error("AI response missing required fields");
          }

          // Stop typing indicator
          io.to(projectId).emit("ai-typing", { isTyping: false });

          // Send AI response to all users in the room
          io.to(projectId).emit("project-message", {
            message: parsedResult, // Send the entire parsed object
            sender: {
              _id: "ai",
              email: "AI Assistant",
            },
            type: "ai"
          });

          // Optional: Save fileTree to project if present
          if (parsedResult.fileTree && Object.keys(parsedResult.fileTree).length > 0) {
            try {
              await projectModel.findByIdAndUpdate(projectId, {
                $set: { 
                  fileTree: parsedResult.fileTree,
                  lastAIUpdate: new Date()
                }
              });
              console.log(`FileTree saved for project: ${projectId}`);
            } catch (dbError) {
              console.error("Error saving fileTree to database:", dbError);
            }
          }

        } catch (aiError) {
          console.error("AI Generation Error:", aiError);
          
          // Stop typing indicator
          io.to(projectId).emit("ai-typing", { isTyping: false });
          
          // Send error message
          io.to(projectId).emit("project-message", {
            message: {
              text: "Sorry, I encountered an error processing your request. Please try again or rephrase your question.",
              error: true,
              details: aiError.message
            },
            sender: {
              _id: "ai",
              email: "AI Assistant",
            },
            type: "ai"
          });
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
      
      // Send error message to the room
      io.to(projectId).emit("project-message", {
        message: {
          text: "An unexpected error occurred. Please try again.",
          error: true
        },
        sender: {
          _id: "ai",
          email: "AI Assistant",
        },
        type: "ai"
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user?.email);
    socket.leave(projectId);
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Global error handler for socket.io
io.engine.on("connection_error", (err) => {
  console.error("Connection error:", err.message);
});

server.listen(port, () => {
  dbConneect();
  console.log(`Server running on port ${port}`);
});
