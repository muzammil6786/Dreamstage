import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true },
    proposedFee: { type: Number, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    artistResponseAt: { type: Date, default: null },
    managerDecisionAt: { type: Date, default: null },
    artistNote: { type: String, default: "" },
    aiMessage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["REQUESTED", "PENDING", "ACCEPTED", "DECLINED", "CONFIRMED", "CANCELLED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

bookingSchema.index(
  { event: 1, artist: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["REQUESTED", "PENDING", "ACCEPTED", "CONFIRMED"] }
    }
  }
);

export default mongoose.model("Booking", bookingSchema);
