const express = require('express');
const app = express();
const PORT = 8080;

const urlDataBase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get('/', (request, response) => {
  response.send('Hello');
});

app.get('/urls.json', (request, response) => {
  response.json(urlDataBase);
});

app.get('/hello', (request, response) => {
  response.send('<html><body style="color:red"> Hello <b>bb</b> </body></html>\n')
})

app.listen(PORT, () => {
  console.log(`App now listening on port ${PORT}...`);
});