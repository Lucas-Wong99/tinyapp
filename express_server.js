const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const { getUserByEmail } = require('./helpers')

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

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const urlsForUser = function(id) {
  let results = {};
  for (const url in urlDatabase) {
    if (id === urlDatabase[url].user_id) {
      results[url] = urlDatabase[url];
    }   
  }
  return results;
}

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
    res.send("Error, user must login")
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
  let templateVars = { 
    user_id: users[req.session.user_id]
    };
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { 
    user_id: users[req.session.user_id]
   };
  res.render("urls_login", templateVars);
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  let templateVars = { 
    urls: urlsForUser(userID),
    user_id: users[req.session.user_id]
   };
  res.render("urls_index", templateVars);
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
    res.status(400).send("This email or password is invalid: Status code 400");
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
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
     user_id: req.session.user_id
    };
  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  const userID = req.session.user_id;
  if (userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(401).send("User is not authorized to perform this action");
  }
});

//Redirects client to shortURL page when button is clicked
app.post("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  res.redirect(`/urls/${shortURL}`);
});

//Edits the longURL into whatever is submitted through client form
app.post("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  } else if (userID && urlDatabase[req.params.id].user_id !== userID) {

  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});