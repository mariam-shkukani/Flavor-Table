const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const homeRouter = require('./routes/home');
const recipesRouter = require('./routes/recipes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', homeRouter);
app.use('/recipes', recipesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
