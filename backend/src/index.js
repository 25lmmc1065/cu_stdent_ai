require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const { generalLimiter } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const departmentRoutes = require('./routes/departments');
const adminRoutes = require('./routes/admin');
const appealRoutes = require('./routes/appeals');
const analyticsRoutes = require('./routes/analytics');

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.use('/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), environment: process.env.NODE_ENV });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/appeals', appealRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, url: req.url, method: req.method });
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
