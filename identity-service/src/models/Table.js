const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
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
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: Number,
      default: 1,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    area: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Area",
      required: true,
    },
    sale_order: {
      type: mongoose.Schema.Types.ObjectId,
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

tableSchema.index({ name: "text" });
const Table = mongoose.model("Table", tableSchema);

module.exports = Table;
