const connectDB = require('./config/db');
const express = require('express');

// Connect Database

connectDB();
const app = express();

// Init Middleware - parses body
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('Dev2 API Running'));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
