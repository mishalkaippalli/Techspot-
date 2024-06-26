const express = require("express");
const app = express();

const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const nocache = require("nocache");
// const morgan = require("morgan")
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
// app.set("views", [
//   path.join(__dirname, "views/user"),
//   path.join(__dirname, "views/admin"),
// ]);

app.use(express.static(path.join(__dirname, "public")));

const userRoutes = require("./routes/userRouter");
const adminRoutes = require("./routes/adminRouter");

// app.use("/", (req, res) => {
//   res.send("yes its working");
// });

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

// app.get('*', function (req, res) {
//     res.redirect("/pageNotFound");
// });

app.listen(PORT, () =>
  console.log(`Server running on  http://localhost:${PORT}`),
);
