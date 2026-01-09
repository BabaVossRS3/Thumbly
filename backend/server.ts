import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import session from 'express-session'
import MongoStore from 'connect-mongo'
import AuthRouter from "./routes/AuthRoutes.js";
import AdminAuthRouter from "./routes/AdminAuthRoutes.js";
import UserAdminRouter from "./routes/UserAdminRoutes.js";
import UserPlanRouter from "./routes/UserPlanRoutes.js";
import SubscriptionRouter from "./routes/SubscriptionRoutes.js";
import ThumbnailUsageRouter from "./routes/ThumbnailUsageRoutes.js";
import ThumbnailRouter from "./routes/ThumbnailRoutes.js";
import UserRouter from "./routes/UserRoutes.js";
import YouTubeRouter from "./routes/YouTubeRoutes.js";
import YouTubeProjectRouter from "./routes/YouTubeProjectRoutes.js";
import AnalyticsRouter from "./routes/AnalyticsRoutes.js";

declare module 'express-session' {
    interface SessionData {
        isLoggedIn: boolean;
        userId: string;
    }
}


await connectDB();
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://thumby.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge:24*60*60*1000*7 // 7 days 
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL as string,
        collectionName: 'sessions'
    })
}))
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});

app.use("/api/auth", AuthRouter);
app.use("/api/admin/auth", AdminAuthRouter);
app.use("/api/admin/users", UserAdminRouter);
app.use("/api/user/plan", UserPlanRouter);
app.use("/api/subscription", SubscriptionRouter);
app.use("/api/thumbnail/usage", ThumbnailUsageRouter);
app.use("/api/thumbnail", ThumbnailRouter);
app.use("/api/user", UserRouter);
app.use("/api/youtube", YouTubeRouter);
app.use("/api/youtube-projects", YouTubeProjectRouter);
app.use("/api/admin", AnalyticsRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
