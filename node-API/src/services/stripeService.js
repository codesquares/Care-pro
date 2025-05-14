
// This file is for setting up the Stripe service
// and exporting the Stripe instance for use in other parts of the application
// Ensure you have the Stripe package installed
const { configDotenv } = require('dotenv');
configDotenv();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Add this to your .env
module.exports = stripe;
