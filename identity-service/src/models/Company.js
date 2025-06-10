const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
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

companySchema.index({ name: "text" });
const Company = mongoose.model("Company", companySchema);

module.exports = Company;
