const express = require('express');
const path = require('path');
const correct = require('./api/correct');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/correct', correct);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
