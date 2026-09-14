import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    stageName: { type: String, required: true, trim: true },
    avatar: { type: String, default: "" },
    genres: [{ type: String }],
    location: { type: String, required: true },
    bio: { type: String, default: "" },
    experience: { type: Number, default: 1, min: 0 },
    fee: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    tags: [{ type: String }],
    availability: [{ type: String }],
    managerTags: [{ type: String }],
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "" },
    managerRating: { type: Number, default: 0, min: 0, max: 5 },
    managerReviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Artist", artistSchema);
