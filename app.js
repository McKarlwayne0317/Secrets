const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

//Session initialization
app.use(
  session({
    secret: "ang aking sekreto",
    resave: false,
    saveUninitialized: false,
  })
);

//Passport initialization
app.use(passport.initialize());
app.use(passport.session());

//Connection string to mongooseXmongoDB
mongoose.connect("mongodb://localhost:27017/userDB");

//User Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//Plugging in passportlocalmongoose with schema
userSchema.plugin(passportLocalMongoose);

//User Model
const User = new mongoose.model("User", userSchema);

//User serial and deserial
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(_id, done){
    User.findById(_id)
        .then(function(user,err){
            done(err, user);
        })
})

//Home Page route
app.route("/").get(function (req, res) {
  res.render("home");
});

//Login Page route
app.route("/login")
    .get(function(req,res){
      res.render("login");
    })
    .post( function (req, res) {
      const user = new User({
        email: req.body.username,
        password: req.body.password,
      });

      req.login(user, function (err) {
        if (err) {
          console.log("Error during login:", err);
          return res.render("login"); // Render login page on error
        }

        // Authentication successful, redirect to secrets page
        passport.authenticate("local")(req, res, function () {
          console.log("User logged in successfully:", user.email);
          return res.redirect("/secrets");
        });
      });
    });

//Register Page route
app.route("/register")
    .get(function (req, res) {
      res.render("register");
    })
    .post(function (req, res) {
      User.register(
          { username: req.body.username },
          req.body.password,
          function (err, user) {
            if (err) {
              console.log(err);
              return res.render("register"); // Render register page on error
            } else {
              passport.authenticate("local")(req, res, function () {
                console.log("User registered successfully:", user.email);
                return res.redirect("/secrets");
              });
            }
          }
      );
    });

app.route("/secrets").get(function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.route("/logout")
    .get(function (req, res) {
        req.logout(function(err) {
            if (err) { return next(err); }
            var params = {
                client_id: process.env['AUTH0_CLIENT_ID'],
                returnTo: 'http://localhost:3000/'
            };
            res.redirect('/');
        });
    })
    .post(function(req,res){

    })

app.listen(process.env.PORT || 3000, function () {
  console.log("Server is up and running");
});
