const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail, filterURLs, userEmailExists, generateRandomString } = require('./helpers');
const PORT = 8080;

/// middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['123789'],

  maxAge: 24 * 60 * 60 * 1000
}));

/// storing data
const urlDataBase = {
  "doritos": {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'userRandomID' 
  },
  "pringles": {
    longURL: "http://www.netflix.ca",
    userID: 'userRandomID' 
  },
  "cheetos": {
    longURL: "http://www.youtube.ca",
    userID: 'user2RandomID' 
  },
  "lays": {
    longURL: "http://www.ebay.ca",
    userID: 'user2RandomID' 
  },
};

/// storing users
const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

//// GET

app.get('/', (request, response) => {
  response.redirect('/signin');
});

app.get('/signin', (request, response) => {
  response.render('urls_signin');
});

app.get('/register', (request, response) => {
  response.render('urls_register');
});

// this takes user to the destination URL
app.get('/u/:shortURL', (request, response) => {
  const longURL = urlDataBase[request.params.shortURL].longURL;
  response.redirect(longURL);
});

// Creating new short URLs
app.get('/urls/new', (request, response) => {
  if (!request.session.user_id) {
    response.redirect('/signin');
  } else {
    const templateVars = { user: users[request.session.user_id] };
    response.render('urls_new', templateVars);
  }
});

// Editing short URL stuff
app.get('/urls/:shortURL', (request, response) => {
  const templateVars = { 
    user: users[request.session.user_id], 
    shortURL: request.params.shortURL, 
    longURL: urlDataBase[request.params.shortURL].longURL, userList: users, 
    urls: urlDataBase 
  };
  response.render('urls_show', templateVars);
});

app.get('/urls', (request, response) => {
  if (!request.session.user_id) {
    response.redirect('/signin');
  } else {
    const templateVars = { 
      user: users[request.session.user_id], 
      urls: filterURLs(request.session.user_id, users), 
      userList: users 
    };
    response.render('urls_index', templateVars);
  }
});

//// POST 

app.post('/register', (request, response) => {
  const newUserID = generateRandomString();

  if (request.body.email === '' || request.body.password === '') {
    response.statusCode = 400;
    response.send('Cannot be empty');
  } else if (userEmailExists(request.body.email, users)) {
    response.statusCode = 400;
    response.send('Email already exists');
  } else {
    const hashedPW = bcrypt.hashSync(request.body.password, 10);
    users[newUserID] = {
      id: newUserID,
      email: request.body.email,
      password: hashedPW
    };
    request.session.user_id = newUserID;
    response.redirect('/urls');
  }
});

app.post('/urls/new', (request, response) => {
  let shortURL = generateRandomString();
  urlDataBase[shortURL] = {
    longURL: request.body.longURL,
    userID: request.session.user_id
  };
  response.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (request, response) => {
  if (request.session.user_id !== urlDataBase[request.params.shortURL].userID) {
    response.statusCode = 400;
    response.send('Do not have the permission to delete someone elses keys');
  } else {
    delete urlDataBase[request.params.shortURL];
    response.redirect('/urls');
  }
});

app.post('/urls/:shortURL/update', (request, response) => {
  if (request.session.user_id !== urlDataBase[request.params.shortURL].userID) {
    response.statusCode = 400;
    response.send('You do not have permission to change someones long url');
  } else {
    urlDataBase[request.params.shortURL].longURL = request.body.longURL;
    response.redirect('/urls');
  }
});

app.post('/login', (request, response) => {
  if (!userEmailExists(request.body.email)) {
    response.statusCode = 403;
    response.send('email not found');
  } else if (userEmailExists(request.body.email)) {
    const savedUser = getUserByEmail(request.body.email, users);
    console.log(savedUser);
    if (!bcrypt.compareSync(request.body.password, savedUser.password)) {
      response.statusCode = 403;
      response.send('Wrong password');
    } else if (bcrypt.compareSync(request.body.password, savedUser.password)) {
      request.session.user_id = savedUser.id;
      response.redirect('/urls');
    }
  }
});

app.post('/logout', (request, response) => {
  response.clearCookie('user_id', request.session.user_id);
  response.redirect('/signin');
});

app.listen(PORT, () => {
  console.log(`App now listening on port ${PORT}...`);
});