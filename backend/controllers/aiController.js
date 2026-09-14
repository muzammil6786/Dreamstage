import Event from "../models/Event.js";
import Artist from "../models/Artist.js";
import Booking from "../models/Booking.js";
import { matchArtistsWithAI } from "../services/groqService.js";

export async function matchArtists(req, res) {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "eventId is required"
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    const booked = await Booking.find({
      event: event._id,
      status: { $in: ["REQUESTED", "PENDING", "ACCEPTED", "CONFIRMED"] }
    }).select("artist");
    const bookedIds = new Set(booked.map((booking) => String(booking.artist)));
    const artists = (await Artist.find()).filter((artist) => !bookedIds.has(String(artist._id)));

    if (!artists.length) {
      return res.status(404).json({
        success: false,
        message: "No unbooked artists are available for this event"
      });
    }

    const aiResult = await matchArtistsWithAI(event, artists);
    const artistMap = new Map(
      artists.map((artist) => [String(artist._id), artist])
    );

    const result = aiResult.matches
      .map((match) => {
        const artist = artistMap.get(String(match.artistId));
        if (!artist) return null;

        return {
          artist,
          matchScore: Number(match.score) || 0,
          reason: match.reason || "Good fit for this event."
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      source: aiResult.source,
      event,
      matches: result,
      ...(aiResult.aiError ? { aiError: aiResult.aiError } : {})
    });
  } catch (error) {
    console.error("Artist matching controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Artist matching failed",
      error: error.message
    });
  }
}

export async function bookingMessage(req, res) {
  try {
    const { eventId, artistId } = req.body;

    const event = await Event.findById(eventId);
    const artist = await Artist.findById(artistId);

    if (!event || !artist) {
      return res.status(404).json({
        success: false,
        message: "Event or artist not found"
      });
    }

    const message = `Hi ${artist.stageName}, I would love to invite you to perform at "${event.title}" on ${event.date} in ${event.location}. The event is a ${event.genre} ${event.type.toLowerCase()} with a budget of ₹${Number(event.budget).toLocaleString("en-IN")}. Please let me know if you are available and interested.`;

    return res.json({
      success: true,
      source: "template",
      message,
      event,
      artist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
