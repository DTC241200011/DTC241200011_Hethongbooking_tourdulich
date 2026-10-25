const client = require('prom-client');

// Initialize default Node.js and system metrics
const register = new client.Registry();
client.collectDefaultMetrics({
  register,
  prefix: 'tour_app_'
});

// HTTP Request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed by Tour Booking web app',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestsTotal);

// HTTP Request latency histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]
});
register.registerMetric(httpRequestDuration);

// Business metrics: Tour Bookings counter
const tourBookingsTotal = new client.Counter({
  name: 'tour_bookings_total',
  help: 'Total number of tour bookings submitted',
  labelNames: ['tour_name', 'status']
});
register.registerMetric(tourBookingsTotal);

// Business metrics: Active Tours gauge
const tourActiveCount = new client.Gauge({
  name: 'tour_active_count',
  help: 'Current number of active tours available in the system'
});
register.registerMetric(tourActiveCount);

// Database query duration
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'PostgreSQL database query duration in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2]
});
register.registerMetric(dbQueryDuration);

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  tourBookingsTotal,
  tourActiveCount,
  dbQueryDuration
};

