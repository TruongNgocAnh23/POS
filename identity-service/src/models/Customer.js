const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    code: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
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
    loyalty_point: {
      type: Number,
      trim: true,
      default: 0,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    created_date: {
      type: Date,
      default: Date.now,
    },
    updated_date: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ name: "text" });
const Customer = mongoose.model("Branch", customerSchema);

module.exports = Customer;
