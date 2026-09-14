import express from "express";
import { bookingMessage, matchArtists } from "../controllers/aiController.js";
import { auth, roles } from "../middleware.js";
const router=express.Router(); router.use(auth,roles('EVENT_MANAGER')); router.post('/match-artists',matchArtists); router.post('/booking-message',bookingMessage); export default router;
