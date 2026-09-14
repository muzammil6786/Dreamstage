import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "Music Event",
        "Stand-up Comedy",
        "Open Mic",
        "Clubbing / DJ",
        "Celebrity Appearance",
        "Corporate Event",
        "Wedding",
        "Festival",
        "Other"
      ],
      default: "Music Event"
    },
    location: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String, default: "19:00" },
    budget: { type: Number, required: true, min: 0 },
    genre: { type: String, required: true, trim: true },
    duration: { type: String, default: "2 hours" },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["DRAFT", "OPEN", "BOOKED", "CANCELLED"],
      default: "OPEN"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
