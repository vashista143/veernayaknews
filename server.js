import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import connectDB from './config/db.js';
import configurePassport from './config/passport.js';
import authRoutes from './routes/auth.route.js'; // Added .js extension
import newsRoutes from "./routes/news.route.js"
dotenv.config();

connectDB();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

configurePassport(passport);
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.send('API is running securely...');
});

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server executing in ${process.env.NODE_ENV} mode on port ${PORT}`);
});