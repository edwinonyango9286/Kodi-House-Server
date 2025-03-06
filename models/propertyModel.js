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

    // current occupant should only exist for a single unit property
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
      maxlength: 50,
      minlength: 2,
    },
    category: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
      enum: ["Single Unit", "Multi Unit"],
      required: true,
    },

    // total number of units
    numberOfUnits: {
      type: Number,
      require: true,
      validate: {
        validator: (value) => {
          return value >= 0;
        },
        message: "Number of units cannot be a negative value",
      },
    },
    occupiedUnits: {
      type: Number,
      default: 0,
      validate: {
        validator: (value) => {
          return value >= 0;
        },
        message: "Occupied units cannot be a negative value",
      },
    },

    // different unit can have different prices
    rent: {
      start: {
        type: Number,
        required: true,
        validate: {
          validator: (value) => {
            return value >= 0;
          },
          message: "Rent start cannot be a negative value",
        },
      },
      end: {
        type: Number,
        validate: {
          validator: (value) => {
            return value >= 0;
          },
          message: "Rent end cannot be a nagative value",
        },
      },
    },
    briefDescription: {
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
      maxlength: 50,
      minlength: 2,
      required: true,
      lowercase: true,
    },
    currentStatus: {
      type: String,
      enum: ["Occupied", "Vacant"],
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Property", propertySchema);
