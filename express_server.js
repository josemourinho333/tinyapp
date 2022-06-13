const express = require('express');
const app = express();
const PORT = 8080;

const urlDataBase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

app.get('/', (request, respond) => {
  respond.send('Hello');
});

app.listen(PORT, () => {
  console.log(`App now listening on port ${PORT}...`);
});