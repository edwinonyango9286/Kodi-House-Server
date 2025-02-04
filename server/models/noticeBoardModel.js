const mongoose = require("mongoose");

const noticeBoardSchema = new mongoose.Schema(
  {
    userTypes: {
      type: String,
      required: true,
      enum: ["Tenants", "CareTakers", "Agents"],
    },

    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 50,
    },
    body: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
    },
    noticeDate: {
      type: Date,
      required: true,
    },
    publishedDate: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NoticeBoard", noticeBoardSchema);
