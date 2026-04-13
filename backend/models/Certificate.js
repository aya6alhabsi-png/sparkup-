import mongoose from "mongoose";
import crypto from "crypto";

function generateCode() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

const certificateSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["EVENT_PARTICIPATION", "IDEA_COMPLETION"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", default: null },
    ideaId: { type: mongoose.Schema.Types.ObjectId, ref: "Idea", default: null },
    code: { type: String, default: generateCode },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;
