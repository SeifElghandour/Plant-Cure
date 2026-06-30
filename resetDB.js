require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const GuestLimit = require('./models/GuestLimit');
const Scan = require('./models/Scan');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI is not defined in .env file');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    return Promise.all([
      User.deleteMany({}),
      GuestLimit.deleteMany({}),
      Scan.deleteMany({})
    ]);
  })
  .then(([usersResult, guestLimitResult, scansResult]) => {
    console.log(`Deleted ${usersResult.deletedCount} users`);
    console.log(`Deleted ${guestLimitResult.deletedCount} guest limits`);
    console.log(`Deleted ${scansResult.deletedCount} scans`);
    console.log('Data Destroyed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error resetting database:', error.message);
    process.exit(1);
  });
