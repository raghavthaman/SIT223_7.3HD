const express = require('express');
const cors = require('cors');
const { register, requestCountMiddleware } = require('./utils/metrics');

const binRoutes = require('./routes/binRoutes');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestCountMiddleware);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.post('/api/call-driver', require('./middlewares/authMiddleware').protect, require('./middlewares/authMiddleware').authorize('admin'), require('./controllers/notificationController').callDriver);
app.use('/api/messages', messageRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/trucks', require('./routes/truckRoutes'));
app.use('/api/bins', binRoutes);
app.use('/health', healthRoutes);

// Error Fallback
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
