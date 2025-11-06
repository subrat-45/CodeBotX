import express from "express";
import morgan from "morgan";
import userRoutes from "./Routes/userRoute.js";
import projectRoutes from "./Routes/projectRoute.js";
import cookieParser from "cookie-parser";
import aiRoutes from "./Routes/aiRoute.js"
import cors from "cors";

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://codebotx-frontend.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {

    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
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
 
