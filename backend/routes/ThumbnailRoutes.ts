import express from "express";
import { generateThumbnail } from "../controllers/ThumbnailController.js";
import { deleteThumbnail } from "../controllers/ThumbnailController.js";
import protect from "../middlewares/Auth.js";

const ThumbnailRouter = express.Router();

ThumbnailRouter.post("/generate", protect, generateThumbnail);
ThumbnailRouter.delete("/delete/:id", protect, deleteThumbnail);

export default ThumbnailRouter;