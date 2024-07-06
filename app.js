const express = require("express");
const app = express();

const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const nocache = require("nocache");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 4000;

require("./DB/dataBase");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(nocache());

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 72 * 60 * 60 * 1000,
      httpOnly: true,
    },
  }),
);

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

const userRoutes = require("./routes/userRouter");
const adminRoutes = require("./routes/adminRouter");


app.use("/", userRoutes);
app.use("/admin", adminRoutes);


app.listen(PORT, () =>
  console.log(`Server running on  http://localhost:${PORT}`),
);
