const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers');

const PORT = 8080; // default port 8080
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "user_id",
  keys: ['secret', 'rotation']
}));
app.use(morgan("dev"));

const urlDatabase = {};

const users = {}

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    user_id: users[req.session.user_id]
   };
   if (templateVars.user_id === undefined) {
     res.redirect("/login");
   } else {
    res.render("urls_new", templateVars);
   }
});

//Accepts get request and redirects user to value of the longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//Handles get request and renders HTML with templateVars
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  if (userID === undefined || userID !== urlDatabase[req.params.shortURL].user_id) {
    res.send('Error, user must login <a href"/login">LOGIN</a>')
  } else {
    let templateVars = { 
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user_id: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  }
});

//Renders the registration page
app.get("/register", (req, res) => { 
  const userID = req.session.user_id; //&***********
   if (!userID) {
    let templateVars = { 
      user_id: users[req.session.user_id]
      };
    res.render("urls_registration", templateVars);
   } else {
     res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls")
  } else {
    let templateVars = { 
      user_id: users[req.session.user_id]
     };
    res.render("urls_login", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.send('User must be logged in to this site <a href="/login"> LOGIN </a>')
  } else {
    let templateVars = { 
      urls: urlsForUser(userID, urlDatabase),
      user_id: users[req.session.user_id]
     };
    res.render("urls_index", templateVars);
  }
});

app.get("*", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//Logs in to an existing user 
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users)
  if (user !== undefined) { 
    if (bcrypt.compareSync(password, users[user].hashedPassword)) {
      req.session.user_id = users[user].id
      res.redirect("/urls");
    } else {
      res.status(403).send("This password is invalid: Status code 403");
    }
  } else {
    res.status(400).send("This email is invalid: Status code 403");
  }
});

//Registers a new email and password into the database and sets id as a userID cookie
app.post("/register", (req, res) => {
  const userID = `user${generateRandomString()}`
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (email === '' || password === '') {
    res.status(400).send("Invalid entry: Status code 400");
  } else if (user !== undefined) {
    res.status(400).send("A user has already registered with this email: Status code 400");
  } else {
    users[userID] = {
      id: userID,
      email: email,
      hashedPassword: bcrypt.hashSync(password, 10)
    }
    req.session.user_id = userID;
    res.redirect("/urls");
  }
  console.log(users)
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

//Assigns a new key value pair to urlDatabase and redirects client
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  const userID = req.session.user_id;
  if (!userID) {
    res.status(401).send("User must be logged in to perform this action")
  } else {
    urlDatabase[randomString] = {
      longURL: req.body.longURL,
       user_id: req.session.user_id
      };
      console.log(urlDatabase);
    res.redirect(`/urls/${randomString}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  const userID = req.session.user_id;
  if (!userID) {
    res.status(401).send("User is not authorized to perform this action");
  } else if (userID && urlDatabase[shortURL].user_id !== userID) {
    res.status(401).send("User is not authorized to delete other URLs");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

//This is the edit button route that redirects the client to the shortURL HTML
app.post("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  res.redirect(`/urls/${shortURL}`);
});

//Edits the longURL into whatever is submitted through client form
app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(401).send("User must be logged in to see URLs");
  } else if (userID && urlDatabase[req.params.id].user_id !== userID) {
    res.status(401).send("User is not authorized to view other user URLs");
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});