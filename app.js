const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrpt = require("bcrypt");
const User = require("./models/User");
const app = express();
const PORT = 3000;
const saltRounds = 10;
const currentuser = {};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

dotenv.config();

mongoose.connect(
  process.env.MONGOURI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("MongoDB Connected!!");
  }
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/alluser", (req, res) => {
  const getUsers = async () => {
    const users = await User.find();
    res.render("allUsers", { users: users });
  };
  getUsers();
});

app.get("/transaction", (req, res) => {
  res.render("transaction");
});

app.get("/user/:id", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  res.render("viewUser", { user: user });
});

app.post("/register", async (req, res) => {
  try {
    let username = req.body.username;
    const email = req.body.email;
    const balance = req.body.balance;
    const salt = await bcrpt.genSalt(saltRounds);
    const hashedPassword = await bcrpt.hash(req.body.password, salt);

    const newUser = await User({
      name: username.toLowerCase(),
      email: email,
      password: hashedPassword,
      balance: balance,
    });
    const user = await newUser.save();
    currentuser = user;
  } catch (error) {
    console.log(error);
  }

  res.redirect("/alluser");
});

app.post("/transaction", async (req, res) => {
  const amount = parseInt(req.body.amount);
  const sender = await User.findOne({ name: req.body.sender.toLowerCase() });
  const receiver = await User.findOne({
    name: req.body.receiver.toLowerCase(),
  });
  const senderbalance = sender.balance;
  const receiverbalance = receiver.balance;
  const success = "Transaction Successfully";
  const fail = "Transaction Failed";
  try {
    await sender.updateOne({ balance: senderbalance - amount });
    await receiver.updateOne({ balance: receiverbalance + amount });
    console.log(success);
    res.redirect("/alluser");
  } catch (err) {
    console.log(err);
    console.log(fail);
    res.redirect("/transaction");
  }
});

app.listen(PORT, () => {
  console.log(`Server is started at ${PORT}`);
});
