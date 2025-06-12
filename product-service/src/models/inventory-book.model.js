import mongoose from "mongoose";

const InventoryBookSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    code_type: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        items: [
          {
            item: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Inventory",
              required: true,
            },
            inventory_id: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Inventory",
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
            },
            cost: {
              type: Number,
              required: true,
            },
          },
        ],
        quantity: {
          type: Number,
          default: 0,
        },
        price: {
          type: Number,
          default: 0,
        },
        vat_rate: {
          type: Number,
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
      },
    ],
    total: {
      type: Number,
      default: 0,
    },
    vat: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    final: {
      type: Number,
      default: 0,
    },
    customerPayment: {
      type: Number,
      default: 0,
    },
    change: {
      type: Number,
      default: 0,
    },
    payment: [
      {
        method: {
          type: String,
          trim: true,
        },
        amount: {
          type: Number,
          default: 0,
        },
      },
    ],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
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

const Inventory = mongoose.model("Inventory", InventorySchema);

export default Inventory;
