const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: [true, "Item description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    category: {
      type: String,
      enum: ["rent", "utilities", "equipment", "transport", "salary", "marketing", "other"],
      default: "other",
    },
    addedBy: { type: String },
    addedDate: { type: String },
    editedBy: { type: String },
    editedDate: { type: String },
  },
  {
    timestamps: true,
  },
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
