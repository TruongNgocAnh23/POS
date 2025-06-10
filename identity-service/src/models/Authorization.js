const mongoose = require("mongoose");

const authorizationSchema = new mongoose.Schema(
  {
    form_name: {
      type: String,
      trim: true,
      required: true,
    },
    permissions: [
      {
        action: {
          type: String,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        users: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              unique: true,
            },
          },
        ],
      },
    ],

    updated_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

authorizationSchema.index({ form_name: "text" });
const Authorization = mongoose.model("Authorization", authorizationSchema);
module.exports = Authorization;
