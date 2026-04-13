import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    capacity: { type: Number, default: 0 },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    registrations: { type: [registrationSchema], default: [] },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
