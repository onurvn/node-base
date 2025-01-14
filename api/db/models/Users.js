const mongoose = require("mongoose");
const is = require("is_js");
const bcrypt = require("bcrypt");

const Enum = require("../../config/Enum");
const CustomError = require("../../lib/Error");

const schema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    first_name: String,
    last_name: String,
    phone_number: String,
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

class Users extends mongoose.model {
  validPassword(password) {
    return bcrypt.compareSync(password, this.password);
  }

  static validateFieldsBeforeAuth(email, password) {
    if (typeof password !== "string" || password.length < Enum.PASS_LENGTH || is.not.email(email))
      throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "validation error", "email or password wrong");
    return null;
  }
}

schema.loadClass(Users);
module.exports = mongoose.model("users", schema);
