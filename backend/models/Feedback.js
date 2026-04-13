import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, default: null },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
