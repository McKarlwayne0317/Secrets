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
    secret: String
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
//The ensureAuthenticated function is defined as middleware.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login"); // Redirect to login page if not authenticated
}
app.route("/secrets")
    .get(ensureAuthenticated ,function (req, res) {

        User.find({"secret":{$ne:null}})
            .then(function(foundUser){
                res.render("secrets",{usersWithSecret:foundUser})
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets")
                })
            })
        .catch(function(err){
            console.log(err);
        })

});

app.route("/submit")
    .get(function(req,res){
    res.render("submit");
    })
    .post(function(req,res){
        const submittedSecret = req.body.secret;
        User.findById({_id:req.user.id}).exec()
            .then(function(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save()
                    .then(function(){
                        console.log(foundUser.secret);
                        res.redirect("/secrets");
                    })
                    .catch(function(err){
                        console.log(err);
                    })

            })
            .catch(function(err){
                console.log(err);
                res.redirect("/secrets");
            })
    });

app.route("/logout")
    .get(function (req, res) {
        req.logout(function(err) {
            if (err) {
                // Handle any potential error here
                console.error("Error during logout:", err);
            }
            // Redirect the user to the home page after logout
            res.redirect("/");
        });
    });
app.listen(process.env.PORT || 3000, function () {
  console.log("Server is up and running");
});
