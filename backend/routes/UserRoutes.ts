import express from "express";
import User from "../models/User.js";
import { getUserThumbnails, getThumbnailById } from "../controllers/UserController.js";
import protect from "../middlewares/Auth.js";


const UserRouter = express.Router()

UserRouter.get('/thumbnails', protect, getUserThumbnails)
UserRouter.get('/thumbnail/:id', protect, getThumbnailById)

export default UserRouter;