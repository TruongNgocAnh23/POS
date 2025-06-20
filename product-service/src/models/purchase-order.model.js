import mongoose from "mongoose";

const PurchaseOrderSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    vendor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    inventory_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    proposed_date: {
      type: Date,
    },
    delivery_date: {
      type: Date,
    },
    items: {
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
          cost: {
            type: Number,
            required: true,
          },
          total_cost: {
            type: Number,
            default: 0,
          },
          notes: {
            type: String,
            trim: true,
          },
        },
      ],
      default: [],
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    total_payment: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
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

PurchaseOrderSchema.pre("save", function (next) {
  let totalAmount = 0;

  this.items.forEach((item) => {
    item.total_cost = item.cost * item.quantity;
    totalAmount += item.total_cost;
  });

  this.total_amount = totalAmount;

  if (typeof this.total_payment === "undefined") {
    this.total_payment = 0;
  }

  next();
});

const PurchaseOrder = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
export default PurchaseOrder;
