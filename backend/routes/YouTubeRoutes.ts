import express from "express";
import { 
  getAuthUrl, 
  handleOAuthCallback, 
  checkYouTubeConnection,
  disconnectYouTube,
  generateMetadata,
  setThumbnail,
  getVideoMetadata,
  getAllVideoMetadata,
  deleteVideoMetadata,
  getMyYouTubeVideos,
  updateVideoMetadata
} from "../controllers/YouTubeController.js";
import isAuth from "../middlewares/Auth.js";

const router = express.Router();

router.get("/auth-url", isAuth, getAuthUrl);
router.get("/oauth-callback", handleOAuthCallback);
router.get("/check-connection", isAuth, checkYouTubeConnection);
router.post("/disconnect", isAuth, disconnectYouTube);
router.post("/generate-metadata", isAuth, generateMetadata);
router.post("/set-thumbnail", isAuth, setThumbnail);
router.post("/update-metadata", isAuth, updateVideoMetadata);
router.get("/metadata/:id", isAuth, getVideoMetadata);
router.get("/metadata", isAuth, getAllVideoMetadata);
router.delete("/metadata/:id", isAuth, deleteVideoMetadata);
router.get("/my-videos", isAuth, getMyYouTubeVideos);

export default router;
