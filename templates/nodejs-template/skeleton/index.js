const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Security and logging middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (required for cloud deployments)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: '${{ values.component_id }}',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: process.env.DB_NAME ? 'configured' : 'not configured'
  });
});

// Database connection info endpoint (if database is configured)
app.get('/db-info', (req, res) => {
  if (!process.env.DB_NAME) {
    return res.json({ message: 'No database configured' });
  }
  
  res.json({
    database: process.env.DB_NAME || 'not set',
    user: process.env.DB_USER || 'not set',
    instance: process.env.DB_INSTANCE || 'not set',
    status: 'Database environment variables configured'
  });
});

// ========================================
// YOUR APPLICATION CODE STARTS HERE
// ========================================

// Basic welcome endpoint - Replace this with your actual API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${{ values.component_id }}!',
    description: '${{ values.description }}',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      docs: '/api/docs', // Add your documentation endpoint
      api: '/api'
    }
  });
});

// Example API endpoints - Replace with your actual endpoints
app.get('/api', (req, res) => {
  res.json({
    message: 'API is running',
    service: '${{ values.component_id }}',
    version: '1.0.0',
    availableEndpoints: [
      'GET /api/example',
      // Add your endpoints here
    ]
  });
});

app.get('/api/example', (req, res) => {
  res.json({
    message: 'This is an example endpoint',
    service: '${{ values.component_id }}',
    timestamp: new Date().toISOString(),
    data: {
      // Add your data structure here
      example: 'Replace this with your actual data'
    }
  });
});

// ========================================
// YOUR APPLICATION CODE ENDS HERE
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    service: '${{ values.component_id }}'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    service: '${{ values.component_id }}'
  });
});

app.listen(port, () => {
  console.log('🚀 ${{ values.component_id }} is running on port ' + port);
  console.log('📊 Health check available at: http://localhost:' + port + '/health');
  console.log('🌍 Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('🔧 Deployment: ${{ values.deploymentType | upper }}');
});
