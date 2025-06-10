import mongoose from "mongoose";

const ItemCategorySchema = new mongoose.Schema(
  {
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCategory",
      default: null,
      trim: true,
    },
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

const ItemCategory = mongoose.model("ItemCategory", ItemCategorySchema);

export default ItemCategory;
