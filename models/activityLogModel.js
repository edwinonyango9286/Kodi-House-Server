import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    activityDate:{
        type:Date,
        default: Date.now()
    }
  },

  {
    timestamps: true,
  }
);
