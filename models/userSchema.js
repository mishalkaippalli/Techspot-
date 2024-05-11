const { default: mongoose } = require("mongoose");
const Mongoose = require("mongoose");

// Declare the Schema of the Mongo model
var userSchema = new Mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdOn: {
    type: String,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: String,
    default: "0",
  },
  cart: {
    type: Array,
  },
  wishlist: {
    type: Array,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  history: {
    type: Array,
  },
  referalCode: {
    type: String,
  },
  redeemed: {
    type: Boolean,
    default: false,
  },
  redeemedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const User = Mongoose.model("User", userSchema);

module.exports = User;
