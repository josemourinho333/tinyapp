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

/// helper, given email, return object with ID and PASSWORD associated with the email
const getPWandIDFromEmail = (email) => {
  for (const user in users) {
    if (email === users[user].email) {
      return { id: users[user].id, password: users[user].password }
    }
  }

  return {};
};

//// GET

app.get('/', (request, response) => {
  response.redirect('/sigin');
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
  if (!request.cookies.user_id) {
    response.redirect('/signin');
  } else {
    const templateVars = { user: users[request.cookies.user_id] };
    response.render('urls_new', templateVars);
  }
});

// Editing short URL stuff
app.get('/urls/:shortURL', (request, response) => {
  const templateVars = { 
    user: users[request.cookies.user_id], 
    shortURL: request.params.shortURL, 
    longURL: urlDataBase[request.params.shortURL].longURL, userList: users, 
    urls: urlDataBase 
  };
  response.render('urls_show', templateVars);
});

app.get('/urls', (request, response) => {
  const templateVars = { 
    user: users[request.cookies.user_id], 
    urls: urlDataBase, 
    userList: users 
  };
  response.render('urls_index', templateVars);
});

//// POST 

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

app.post('/urls/new', (request, response) => {
  let shortURL = generateRandomString();
  urlDataBase[shortURL] = {
    longURL: request.body.longURL,
    userID: request.cookies.user_id
  };
  response.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:shortURL/delete', (request, response) => {
  if (request.cookies.user_id !== urlDataBase[request.params.shortURL].userID) {
    response.statusCode = 400;
    response.send('Do not have the permission to delete someone elses keys');
  } else {
    delete urlDataBase[request.params.shortURL];
    response.redirect('/urls');
  }
});

app.post('/urls/:shortURL/update', (request, response) => {
  if (request.cookies.user_id !== urlDataBase[request.params.shortURL].userID) {
    response.statusCode = 400;
    response.send('You do not have permission to change someones long url');
  } else {
    urlDataBase[request.params.shortURL].longURL = request.body.longURL;
    response.redirect('/urls');
  }
});

app.post('/login', (request, response) => {
  console.log(request.body);
  if (!userEmailExists(request.body.email)) {
    response.statusCode = 403;
    response.send('email not found');
  } else if (userEmailExists(request.body.email)) {
    const savedUser = getPWandIDFromEmail(request.body.email);
    if (request.body.password !== savedUser.password) {
      response.statusCode = 403;
      response.send('Wrong password');
    } else if (request.body.password === savedUser.password) {
      response.cookie('user_id', savedUser.id);
      response.redirect('/urls')
    }
  }
});

app.post('/logout', (request, response) => {
  response.clearCookie('user_id', request.cookies.user_id);
  response.redirect('/signin');
});

app.listen(PORT, () => {
  console.log(`App now listening on port ${PORT}...`);
});