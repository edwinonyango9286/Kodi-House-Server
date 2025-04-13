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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("NoticeBoard", noticeBoardSchema);
