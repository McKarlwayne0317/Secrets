
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');

//Bcrypt salt
const saltRounds = 10;

//Connection string to mongooseXmongoDB
mongoose.connect("mongodb://localhost:27017/userDB");

//User Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});



//User Model
const User = new mongoose.model("User", userSchema);

//Home Page route
app.route("/")
    .get(function(req,res){
res.render("home")
    })

//Login Page route
app.route("/login")
    .get(function(req,res){
        res.render("login")
    })
    .post(function(req,res){
        User.findOne({email:req.body.username}).exec()
            .then(function(foundUser){
                if(foundUser){
                    bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                        if(result === true){
                            res.render("secrets")
                            console.log("Successfully logged in as "+foundUser.email);
                        }else{
                            res.render("login");
                            console.log("Incorrect password!!");
                        }
                    });
                }else{
                    res.render("login");
                    console.log("User not found!!" +foundUser.email);
                }
            })
        .catch(function(err){
            console.log(err);
        })
    })

//Register Page route
app.route("/register")
    .get(function(req,res){
        res.render("register")
    })
    .post(function(req,res){
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            const newUser = new User({
                email:req.body.username,
                password:hash
            });
            newUser.save()
                .then(function(savedUser){
                    res.render("secrets")
                    console.log("Successfully registered a new user, " + savedUser)
                })
                .catch(function(err){
                    console.log(err)
                });
        });

    })


app.listen(process.env.PORT || 3000, function(){
    console.log("Server is up and running");
})

