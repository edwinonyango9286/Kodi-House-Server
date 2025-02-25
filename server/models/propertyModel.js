const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
      required: true,
      validate: {
        validator: function (id) {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    currentOccupant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      validate: {
        validator: (id) => {
          return mongoose.Types.ObjectId.isValid(id);
        },
        message: (props) => `${props.value} is not a valid objectId`,
      },
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2,
      minlength: 50,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
        validate: {
          validator: function (id) {
            return mongoose.Types.ObjectId.isValid(id);
          },
          message: (props) => `${props.value} is not a valid objectId`,
        },
      },
    ],
    type: {
      type: String,
      enum: ["Single Unit", "Multi unit"],
      required: true,
    },
    numberOfUnits: {
      type: Number,
      default: 0,
    },
    rentPerUnit: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    videos: [
      {
        secure_url: {
          type: String,
        },
        public_id: {
          type: String,
        },
      },
    ],
    googleMap: {
      type: String,
      required: true,
    },
    images: [
      {
        secure_url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],

    features: {
      swimmingPool: {
        type: Boolean,
        default: false,
      },
      airConditioning: {
        type: Boolean,
        default: false,
      },
      internet: {
        type: Boolean,
        default: false,
      },
      terrace: {
        type: Boolean,
        default: false,
      },
      coffeePot: {
        type: Boolean,
        default: false,
      },
      towels: {
        type: Boolean,
        default: false,
      },
      radio: {
        type: Boolean,
        default: false,
      },
      balcony: {
        type: Boolean,
        default: false,
      },
      roofTerrace: {
        type: Boolean,
        default: false,
      },
      grill: {
        type: Boolean,
        default: false,
      },
      computer: {
        type: Boolean,
        default: false,
      },
      gym: {
        type: Boolean,
        default: false,
      },

      tvCable: {
        type: Boolean,
        default: false,
      },
      parquet: {
        type: Boolean,
        default: false,
      },
      oven: {
        type: Boolean,
        default: false,
      },
    },

    numberOfBedRooms: {
      type: Number,
      default: 0,
    },

    numberOfBathRooms: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      maxlength: 2,
      minlength: 50,
      required: true,
      lowercase: true,
    },
    currentStatus: {
      type: String,
      enum: ["Occupied", "Vacant"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Property", propertySchema);
