const mongoose = require("mongoose");

const tagSchema = mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      requried: true,
    },
    tagName: {
      type: String,
      requried: true,
    },
    description:{
        type:String,
        required:true,
    },
    parentTag: {
      type: String,
      requried: true,
    },
    options: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      requried: true,
      enum: ["Active", "Disabled"],
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TagModel", tagSchema);
