import Artist from "../models/Artist.js";
import ArtistFeedback from "../models/ArtistFeedback.js";

export async function getArtists(req, res) {
  try {
    const artists = await Artist.find().sort({ rating: -1, reviews: -1 });
    res.json({ success: true, artists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getArtist(req, res) {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) return res.status(404).json({ success: false, message: "Artist not found" });
    res.json({ success: true, artist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateMyArtistProfile(req, res) {
  try {
    if (req.user.role !== "ARTIST" || !req.user.artist) {
      return res.status(403).json({ success: false, message: "Artist account required" });
    }

    const allowed = ["name", "stageName", "avatar", "genres", "location", "bio", "experience", "fee", "tags", "availability"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const artist = await Artist.findByIdAndUpdate(req.user.artist._id, updates, {
      new: true,
      runValidators: true
    });
    if (!artist) return res.status(404).json({ success: false, message: "Artist profile not found" });

    await req.user.populate("artist");
    res.json({ success: true, artist, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, artist: req.user.artist } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getArtistFeedback(req, res) {
  try {
    const feedback = await ArtistFeedback.find({ artist: req.params.id })
      .populate("event", "title date")
      .populate("manager", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
