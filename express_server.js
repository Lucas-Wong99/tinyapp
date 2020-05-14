const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    user_id: "user3RandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
     user_id: "user3RandomID"
    }
};

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID", 
    email: "user3@example.com", 
    password: "shake-shake"
  }
}

const checkEmail = (emailId) => {
  for (const user in users) {
    if (emailId === users[user].email) {
      return true;
    }
  }
  return false;
}

const checkPassword = (emailID, passwordID) => {
  for (const user in users) {
    if (passwordID === users[user].password && emailID === users[user].email) {
      return true;
    }
  }
  return false;
}

const urlsForUser = function(id) {
  let results = {};
  for (const url in urlDatabase) {
    if (id === urlDatabase[url].user_id) {
      results[url] = urlDatabase[url];
    }   
  }
}

//Registers a new email and password into the database and sets id as a userID cookie
app.post("/register", (req, res) => {
  const userID = `user${generateRandomString()}`
  const { email, password } = req.body;
  if (email === '' || password === '') {
    res.status(400).send("This email or password is invalid: Status code 400");
  } else if (checkEmail(email)) {
    res.status(400).send("A user has already registered with this email: Status code 400");
  } else {
    users[userID] = {
      id: userID,
      email: email,
      password: password
    }
    res.cookie('user_id', userID);
    res.redirect("/urls");
    console.log(users);
  }
});

//Renders the registration page
app.get("/register", (req, res) => {
  let templateVars = { 
    user_id: users[req.cookies["user_id"]]
   };
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { 
    user_id: users[req.cookies["user_id"]]
   };
  res.render("urls_login", templateVars);
})

//Logs in to an existing user 
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (checkEmail(email)) {
    if (checkPassword(email, password)) {
      let userID = ''
      for (const user in users) {
        if (users[user].email === email) {
          userID = users[user].id;
        }
      }
      res.cookie("user_id", userID);
      res.redirect("/urls");
    } else {
      res.status(403).send("This email or password is invalid: Status code 403");
    }  
  } else {
    res.status(400).send("This email or password is invalid: Status code 403");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

//Assigns a new key value pair to urlDatabase and redirects client
app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = {
    longURL: req.body.longURL,
     url_id: req.cookies["user_id"]
    };
    console.log(urlDatabase);
  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.params;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//Redirects client to shortURL page when button is clicked
app.post("/u/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  res.redirect(`/urls/${shortURL}`);
});

//Edits the longURL into whatever is submitted through client form
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    user_id: users[req.cookies["user_id"]]
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
  let templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user_id: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    urls: urlDatabase,
    user_id: users[req.cookies["user_id"]]
   };
  res.render("urls_index", templateVars);
});

app.get("/", (req, res) => {
  // if (req.cookie["user_id"]) {
  //   res.redirect("/urls");
  // } else {
  //   res.redirect("/login");
  // }
  res.send("Nothing here mate");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});