const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080;


function generateRandomString() {
  const randomNum = () => {
    return Math.floor(Math.random() * 26) + 97;
  }

  return String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum()) + String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum()) + String.fromCharCode(randomNum()).toUpperCase() + String.fromCharCode(randomNum())
};

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDataBase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (request, response) => {
  response.send('Hello');
});

app.get('/u/:shortURL', (request, response) => {
  const longURL = urlDataBase[request.params.shortURL];
  response.redirect(longURL);
})

app.get('/urls/new', (request, response) => {
  const templateVars = { username: request.cookies.username };
  response.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (request, response) => {
  const templateVars = { username: request.cookies.username, shortURL: request.params.shortURL, longURL: urlDataBase[request.params.shortURL] };
  response.render('urls_show', templateVars);
});

app.get('/urls', (request, response) => {
  const templateVars = { username: request.cookies.username, urls: urlDataBase };
  response.render('urls_index', templateVars);
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
  response.cookie('username', request.body.username);
  response.redirect('/urls');
});

app.post('/logout', (request, response) => {
  response.clearCookie('username', request.cookies.username);
  response.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`App now listening on port ${PORT}...`);
});