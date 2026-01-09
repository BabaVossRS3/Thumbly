import express from "express";
import {
  createYouTubeProject,
  getMyYouTubeProjects,
  getYouTubeProject,
  updateYouTubeProject,
  deleteYouTubeProject,
} from "../controllers/YouTubeProjectController.js";
import isAuth from "../middlewares/Auth.js";

const router = express.Router();

router.post("/", isAuth, createYouTubeProject);
router.get("/", isAuth, getMyYouTubeProjects);
router.get("/:id", isAuth, getYouTubeProject);
router.put("/:id", isAuth, updateYouTubeProject);
router.delete("/:id", isAuth, deleteYouTubeProject);

export default router;
