const Mongoose = require("mongoose");

const connectDB = Mongoose.connect(process.env.MONGODB_URL);

connectDB
  .then(() => console.log("Database Connected"))
  .catch((err) => console.log(err.message));
