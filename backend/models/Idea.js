import mongoose from "mongoose";

const adminCommentSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    comment: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ideaSchema = new mongoose.Schema(
  {
    innovatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    ipFormUrl: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "submitted",
        "admin_changes_requested",
        "with_reviewer",
        "reviewer_changes_requested",
        "reviewer_approved",
        "presented_to_funders",
        "funding_pending",
        "in_progress",
        "resolved",
        "rejected",
        "under_review",
        "approved",
      ],
      default: "submitted",
    },

    adminComments: { type: [adminCommentSchema], default: [] },
    assignedReviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    evaluationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Evaluation" }],

    contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract", default: null },
    lastUpdatedByFunderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

ideaSchema.statics.allowedStatuses = [
  "submitted",
  "admin_changes_requested",
  "with_reviewer",
  "reviewer_changes_requested",
  "reviewer_approved",
  "presented_to_funders",
  "funding_pending",
  "in_progress",
  "resolved",
  "rejected",
  "under_review",
  "approved",
];

const Idea = mongoose.model("Idea", ideaSchema);
export default Idea;
