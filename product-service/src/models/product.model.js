import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
      default: null,
      trim: true,
    },
    recipe: {
      type: [
        {
          item_category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ItemCategory",
            required: true,
          },
          item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true,
          },
          unit_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Unit",
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
    code: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    tax_rate: {
      type: Number,
      required: true,
      default: 0,
    },
    vat: {
      type: Number,
      default: 0,
    },
    price_after_vat: {
      type: Number,
      default: 0,
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
