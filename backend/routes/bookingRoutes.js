import express from "express";
import { auth, roles } from "../middleware.js";
import {
  artistAvailability,
  artistDecision,
  createBooking,
  getBooking,
  getBookings,
  getAllBookings,
  managerDecision,
  cancelBookingByArtist,
  managerFeedback
} from "../controllers/bookingController.js";

const router = express.Router();
router.use(auth);
router.post("/", roles("EVENT_MANAGER"), createBooking);
router.get("/", getBookings);
router.get("/all", roles("EVENT_MANAGER"), getAllBookings);
router.get("/artist/:artistId/availability", artistAvailability);
router.get("/:id", getBooking);
router.patch("/:id/artist-decision", roles("ARTIST"), artistDecision);
router.patch("/:id/manager-decision", roles("EVENT_MANAGER"), managerDecision);
router.patch("/:id/cancel", roles("ARTIST"), cancelBookingByArtist);
router.post("/:id/feedback", roles("EVENT_MANAGER"), managerFeedback);
export default router;
