const Mongoose = require("mongoose")

const connectDB = Mongoose.connect('mongodb://localhost:27017')

connectDB
    .then(()=>console.log("Database Connected"))
    .catch((err)=>console.log(err.message))