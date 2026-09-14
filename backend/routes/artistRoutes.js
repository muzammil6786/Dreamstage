import express from "express";
import { getArtist, getArtists, updateMyArtistProfile, getArtistFeedback } from "../controllers/artistController.js";
import { auth, roles } from "../middleware.js";

const router = express.Router();
router.get("/", getArtists);
router.get("/:id", getArtist);
router.get("/:id/feedback", auth, getArtistFeedback);
router.patch("/me", auth, roles("ARTIST"), updateMyArtistProfile);
export default router;
