const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    hotline: {
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
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
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
