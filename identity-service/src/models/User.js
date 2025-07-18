const mongoose = require("mongoose");
const argon2 = require("argon2");
const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    user_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    gender: {
      type: Number,
      trim: true,
    },
    birthday: {
      type: Date,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    role: [
      {
        company: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Company",
          required: true,
        },
        branch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Branch",
          required: true,
        },
        department: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
          required: true,
        },
      },
    ],
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

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      return next(error);
    }
  }
});
userSchema.methods.comparePassword = async function (candidataPassword) {
  try {
    return await argon2.verify(this.password, candidataPassword);
  } catch (error) {
    throw error;
  }
};

userSchema.index({ user_name: "text" });
const User = mongoose.model("User", userSchema);
module.exports = User;
