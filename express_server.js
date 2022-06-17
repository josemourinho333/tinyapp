const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail, filterURLs, userEmailExists, generateRandomString, dataExists } = require('./helpers');
const PORT = 8080;

/// middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['123789'],
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
// If logged in, will redirect to /urls page if not, will redirect to /login page
app.get('/', (request, response) => {
  if (!request.session.user_id) {
    response.redirect('/login');
  } else {
    response.redirect('/urls');
  }
});

// If logged in already, redirects to /urls. otherwise, will render login page
app.get('/login', (request, response) => {
  if (!request.session.user_id) {
    response.render('urls_login');
  } else {
    response.redirect('/urls');
  }
});

// Renders registration page
app.get('/register', (request, response) => {
  response.render('urls_register');
});

// this takes user to the destination URL. 403 is shortURL doesn't exist. Redirects to longURL from given shortURL if exists in database regardless who made it
app.get('/u/:shortURL', (request, response) => {
  if (dataExists(request.params.shortURL, urlDataBase)) {
    const longURL = urlDataBase[request.params.shortURL].longURL;
    response.redirect('https://' + longURL);
  } else {
    return response.status(403).send(`<h2>Error 403. Bad request. Does not exist. <a href='/login'>Sign in to use TinyApp.</a></h2>`);
  }
});

// Creating new short URLs - redirect to /login if not logged in, else renders a page where you can create key.
app.get('/urls/new', (request, response) => {
  if (!request.session.user_id) {
    response.redirect('/login');
  } else {
    const templateVars = { user: users[request.session.user_id] };
    response.render('urls_new', templateVars);
  }
});

// Editing short URL stuff. If logged in, you can edit any keys you have access to. If going to /urls/SOMEONELSEKEY, while you will see the page, if you click update, you won't be able to update. IF NOT LOGGED IN, it will send you an error right away.
app.get('/urls/:shortURL', (request, response) => {
  if (!request.session.user_id) {
    response.status(403).send(`<h2>Error 403. Access denied. <a href='/login'>You must sign in to use TinyApp.</a></h2>`);
  } else {
    const templateVars = { 
      user: users[request.session.user_id], 
      shortURL: request.params.shortURL, 
      longURL: urlDataBase[request.params.shortURL].longURL, userList: users, 
      urls: urlDataBase
    };
    response.render('urls_show', templateVars);
  }
});

// if not logged in, redirect to /login page with error status. If logged in, will render urls_index page.
app.get('/urls', (request, response) => {
  if (!users[request.session.user_id]) {
    request.session.user_id = null;
  }

  if (!request.session.user_id) {
    return response.status(403).redirect('/login');
  } else {
    const templateVars = { 
      user: users[request.session.user_id], 
      urls: filterURLs(request.session.user_id, urlDataBase),
    };
    response.render('urls_index', templateVars);
  }
});

//// POST 
// if empty or account exists already, send error and message. If succesful, sets a new session cookie and redirects to /urls.
app.post('/register', (request, response) => {
  const newUserID = generateRandomString();
  if (request.body.email === '' || request.body.password === '') {
    return response.status(400).send(`<h2>Error 400. Fields cannot be empty. <a href='/register'>Go back to registration page.</a></h2>`);
  } else if (userEmailExists(request.body.email, users)) {
    return response.status(400).send(`<h2>Error 400. Email is already in use. <a href='/register'>Go back to registration page.</a></h2>`);
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

// creates new shorURL and creates an object with the longURL and userID of the account who created it. Redirects to a edit page of the newly created shortURL.
app.post('/urls/new', (request, response) => {
  let shortURL = generateRandomString();
  urlDataBase[shortURL] = {
    longURL: request.body.longURL,
    userID: request.session.user_id
  };
  response.redirect(`/urls/${shortURL}`);
});

// Deletes shortURL. if you're logged in, and accessed shortURL of someone else's you won't be able to delete it still.
app.post('/urls/:shortURL/delete', (request, response) => {
  if (request.session.user_id !== urlDataBase[request.params.shortURL].userID) {
    return response.status(400).send(`<h2>Error 400. Permission denied. <a href='/login'>Log in to deletee short URLs.</a></h2>`);
  } else {
    delete urlDataBase[request.params.shortURL];
    response.redirect('/urls');
  }
});

// Updates longURL of a shortURL. if you're logged in, and accessed shortURL of someone else's you won't be able to update it still.
app.post('/urls/:shortURL/update', (request, response) => {
  if (request.session.user_id !== urlDataBase[request.params.shortURL].userID) {
    return response.status(400).send(`<h2>Error 400. Permission denied. <a href='/login'>Log in to edit/update short URLs.</a></h2>`)
  } else {
    urlDataBase[request.params.shortURL].longURL = request.body.longURL;
    response.redirect('/urls');
  }
});

// Login validation. if email doesn't exist or password doesn't match, throw error and message. If successful, use the existing user's ID as the session user_id in a cookie and redirects to /urls
app.post('/login', (request, response) => {
  if (!userEmailExists(request.body.email, users)) {
    return response.status(403).send(`<h2>Error 403. Email not found. <a href='/login'>Click here to try logging in again.</a></h2>`);
  } else if (userEmailExists(request.body.email, users)) {
    const savedUser = getUserByEmail(request.body.email, users);
    if (!bcrypt.compareSync(request.body.password, savedUser.password)) {
      return response.status(403).send(`<h2>Error 403. Wrong password. <a href='/login'>Click here to try logging in again.</a></h2>`);
    } else if (bcrypt.compareSync(request.body.password, savedUser.password)) {
      request.session.user_id = savedUser.id;
      response.redirect('/urls');
    }
  }
});

// will log someone out, sets cookies to null and redirects to /login page.
app.post('/logout', (request, response) => {
  request.session = null;
  response.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`App now listening on port ${PORT}...`);
});