const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to DB
require('./Models/db');

// Import Routes
const AuthRouter = require('./Routes/AuthRouter');
const BookingRouter = require('./Routes/bookingRouter');
const StayRouter = require('./Routes/StayRouter');
// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api/auth', AuthRouter);           
app.use('/api/bookings', BookingRouter);
app.use('/api/stay', StayRouter);

// Server listen
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
