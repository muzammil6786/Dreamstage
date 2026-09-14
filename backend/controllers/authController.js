import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Artist from "../models/Artist.js";

const secret = () => process.env.JWT_SECRET || "dev-secret-change-me";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  artist: user.artist || null
});

export async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      role = "EVENT_MANAGER",
      artistId,
      stageName,
      avatar,
      genres = [],
      location,
      bio = "",
      experience = 0,
      fee = 0,
      tags = [],
      availability = []
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }
    if (!["EVENT_MANAGER", "ARTIST"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    let artist = null;

    if (role === "ARTIST") {
      if (artistId) {
        artist = await Artist.findById(artistId);
        if (!artist) return res.status(404).json({ success: false, message: "Artist profile not found" });
        if (await User.findOne({ artist: artistId })) {
          return res.status(409).json({ success: false, message: "This artist already has an account" });
        }
      } else {
        if (!stageName || !location) {
          return res.status(400).json({ success: false, message: "Stage name and city are required for an artist profile" });
        }
        artist = await Artist.create({
          name,
          stageName,
          avatar: avatar || "",
          genres: Array.isArray(genres) ? genres : [],
          location,
          bio,
          experience: Number(experience) || 0,
          fee: Number(fee) || 0,
          tags: Array.isArray(tags) ? tags : [],
          availability: Array.isArray(availability) ? availability : []
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      artist: artist?._id || null
    });

    const token = jwt.sign({ userId: user._id, role: user.role }, secret(), { expiresIn: "7d" });
    await user.populate("artist");
    res.status(201).json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() }).populate("artist");
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: "Account is disabled" });

    const token = jwt.sign({ userId: user._id, role: user.role }, secret(), { expiresIn: "7d" });
    res.json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function me(req, res) {
  await req.user.populate("artist");
  res.json({ success: true, user: publicUser(req.user) });
}
