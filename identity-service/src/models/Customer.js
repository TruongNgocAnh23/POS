const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    phone_list: [
      {
        phone: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
    ],
    address: {
      type: String,
      trim: true,
    },
    tax: {
      type: String,
      trim: true,
    },
    fax: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    created_date: {
      type: Date,
      default: Date.now,
    },
    updated_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

branchSchema.index({ name: "text" });
const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
