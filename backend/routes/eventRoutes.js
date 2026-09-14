import express from "express";
import { createEvent, getEvent, getEvents, updateEvent, deleteEvent } from "../controllers/eventController.js";
import { auth, roles } from "../middleware.js";

const router = express.Router();
router.use(auth);
router.post("/", roles("EVENT_MANAGER"), createEvent);
router.get("/", getEvents);
router.get("/:id", getEvent);
router.patch("/:id", roles("EVENT_MANAGER"), updateEvent);
router.delete("/:id", roles("EVENT_MANAGER"), deleteEvent);
export default router;
