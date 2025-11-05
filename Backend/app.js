import express from "express";
import morgan from "morgan";
import dbConneect from "./DB/db.js";
import userRoutes from "./Routes/userRoute.js";
import projectRoutes from "./Routes/projectRoute.js";
import cookieParser from "cookie-parser";
import aiRoutes from "./Routes/aiRoute.js"
import cors from "cors";

dbConneect();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/ai", aiRoutes)

app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
 