const express = require('express');
const path = require('path');
const chatRoute = require('./routes/chat');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup static folder
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware - PENTING INI HARUS ADA!
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/', chatRoute);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Open your browser and visit: http://localhost:${PORT}`);
});