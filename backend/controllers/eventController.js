import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import Artist from "../models/Artist.js";

function validateDateTime(date, startTime = "19:00") {
  const value = new Date(`${date}T${startTime || "19:00"}:00`);
  return !Number.isNaN(value.getTime()) ? value : null;
}

export async function createEvent(req, res) {
  try {
    if (req.user.role !== "EVENT_MANAGER") {
      return res.status(403).json({ success: false, message: "Only event managers can create events" });
    }
    const eventDate = validateDateTime(req.body.date, req.body.startTime);
    if (!eventDate || eventDate <= new Date()) {
      return res.status(400).json({ success: false, message: "Event date and time must be in the future" });
    }
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getEvents(req, res) {
  try {
    const events = await Event.find({ createdBy: req.user._id, status: { $ne: "CANCELLED" } }).sort({ date: 1, startTime: 1 });
    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getEvent(req, res) {
  try {
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id, status: { $ne: "CANCELLED" } });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const bookings = await Booking.find({ event: event._id })
      .populate("artist")
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 });

    const summary = {
      total: bookings.length,
      requested: bookings.filter((b) => b.status === "REQUESTED").length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      accepted: bookings.filter((b) => b.status === "ACCEPTED").length,
      confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
      declined: bookings.filter((b) => b.status === "DECLINED").length,
      cancelled: bookings.filter((b) => b.status === "CANCELLED").length
    };

    res.json({ success: true, event, bookings, bookingSummary: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEvent(req, res) {
  try {
    if (req.user.role !== "EVENT_MANAGER") {
      return res.status(403).json({ success: false, message: "Event manager account required" });
    }
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id, status: { $ne: "CANCELLED" } });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const nextDate = req.body.date || event.date;
    const nextTime = req.body.startTime || event.startTime || "19:00";
    const eventDate = validateDateTime(nextDate, nextTime);
    if (!eventDate || eventDate <= new Date()) {
      return res.status(400).json({ success: false, message: "Event date and time must be in the future" });
    }

    if (String(nextDate) !== String(event.date)) {
      const confirmed = await Booking.find({ event: event._id, status: "CONFIRMED" });
      for (const booking of confirmed) {
        const conflict = await Booking.findOne({
          artist: booking.artist,
          status: "CONFIRMED",
          _id: { $ne: booking._id }
        }).populate("event");
        if (conflict?.event?.date === nextDate) {
          return res.status(409).json({ success: false, message: "The new date conflicts with a confirmed booking for one of the artists" });
        }
      }
    }

    const allowed = ["title", "type", "location", "date", "startTime", "budget", "genre", "duration", "description"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) event[key] = req.body[key];
    }
    await event.save();
    res.json({ success: true, event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function deleteEvent(req, res) {
  try {
    if (req.user.role !== "EVENT_MANAGER") {
      return res.status(403).json({ success: false, message: "Event manager account required" });
    }
    const event = await Event.findOne({ _id: req.params.id, createdBy: req.user._id, status: { $ne: "CANCELLED" } });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    event.status = "CANCELLED";
    await event.save();
    await Booking.updateMany(
      { event: event._id, status: { $in: ["PENDING", "ACCEPTED", "CONFIRMED"] } },
      { $set: { status: "CANCELLED", managerDecisionAt: new Date() } }
    );
    res.json({ success: true, message: "Event removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
