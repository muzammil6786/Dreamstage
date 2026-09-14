import mongoose from "mongoose";

const artistFeedbackSchema = new mongoose.Schema(
  {
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: "" },
    tags: [{ type: String }],
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "" }
  },
  { timestamps: true }
);

artistFeedbackSchema.index({ artist: 1, createdAt: -1 });

export default mongoose.model("ArtistFeedback", artistFeedbackSchema);
