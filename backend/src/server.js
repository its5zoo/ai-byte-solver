import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

connectDB();

app
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the other process or set PORT in .env`);
      process.exit(1);
    }
    throw err;
  });
