import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemCategory",
      default: null,
      trim: true,
    },
    inventories: {
      type: [
        {
          inventory_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
          },
          branch_id: {
            type: mongoose.Schema.Types.ObjectId,
          },
          quantity: {
            type: Number,
            required: true,
          },
          cost: {
            type: Number,
            required: true,
          },
          cost: {
            type: Number,
            required: true,
          },
          prev_cost: {
            type: Number,
            default: 0,
          },
          wholesale_price: {
            type: Number,
            default: 0,
          },
          retail_price: {
            type: Number,
            default: 0,
          },
          updated_at: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    unit_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
      trim: true,
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

const Item = mongoose.model("Item", ItemSchema);

export default Item;
