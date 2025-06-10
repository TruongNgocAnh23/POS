import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    receipt: {
      type: [
        {
          item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
          },
        },
      ],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    created_by: {
      type: String,
      trim: true,
    },
    updated_by: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Product = mongoose.model("Product", ProductSchema);

export default Product;
