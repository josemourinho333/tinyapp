const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080;

/// middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/// storing data
const urlDataBase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/// storing users
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
  }
};

/// generate random 6 character strings
function generateRandomString() {
  const randomNum = () => {
    return Math.floor(Math.random() * 26) + 97;
  }

  return String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum()) + String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum()) + String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum())
};

/// checking if given email already exists in users user object
const userEmailExists = (email) => {
  for (const user in users) {
    if (email === users[user].email) {
      return true;
    }
  }
  return false;
};

app.get('/', (request, response) => {
  response.redirect('/urls');
});

app.get('/register', (request, response) => {
  response.render('urls_register');
});

app.get('/u/:shortURL', (request, response) => {
  const longURL = urlDataBase[request.params.shortURL];
  response.redirect(longURL);
})

app.get('/urls/new', (request, response) => {
  const templateVars = { user: users[request.cookies.user_id] };
  response.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (request, response) => {
  const templateVars = { user: users[request.cookies.user_id], shortURL: request.params.shortURL, longURL: urlDataBase[request.params.shortURL] };
  response.render('urls_show', templateVars);
});

app.get('/urls', (request, response) => {
  const templateVars = { user: users[request.cookies.user_id], urls: urlDataBase };
  response.render('urls_index', templateVars);
});

app.post('/register', (request, response) => {
  const newUserID = generateRandomString();

  if (request.body.email === '' || request.body.password === '') {
    response.statusCode = 400;
    response.send('Cannot be empty');
  } else if (userEmailExists(request.body.email)) {
    response.statusCode = 400;
    response.send('Email already exists');
  } else {
    users[newUserID] = {
      id: newUserID,
      email: request.body.email,
      password: request.body.password
    };
    response.cookie('user_id', newUserID);
    response.redirect('/urls');
  }
});

app.post('/urls', (request, response) => {
  let shortURL = generateRandomString();
  urlDataBase[shortURL] = 'http://' + request.body.longURL;
  response.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (request, response) => {
  delete urlDataBase[request.params.shortURL];
  response.redirect('/urls');
});

app.post('/urls/:shortURL/update', (request, response) => {
  urlDataBase[request.params.shortURL] = request.body.longURL;
  response.redirect('/urls');
});

app.post('/login', (request, response) => {
  response.cookie('user_id', request.body.user_id);
  response.redirect('/urls');
});

app.post('/logout', (request, response) => {
  response.clearCookie('user_id', request.cookies.user_id);
  response.redirect('/register');
});

app.listen(PORT, () => {
  console.log(`App now listening on port ${PORT}...`);
});