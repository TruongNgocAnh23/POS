import mongoose from "mongoose";

const SaleOrderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        notes: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
          default: 0,
        },
        isServed: {
          type: Boolean,
          default: false,
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
    notes: {
      type: String,
      trim: true,
    },
    isCancel: {
      type: Boolean,
      trim: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const SaleOrder = mongoose.model("SaleOrder", SaleOrderSchema);

export default SaleOrder;
