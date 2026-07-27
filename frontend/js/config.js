// Sales Tracker Pro Cloud Configuration
const CONFIG = {
  API_BASE_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api',
  AWS_S3_BUCKET: 'csbc252-sales-tracker-assets',
  AWS_REGION: 'us-east-1'
};

window.CONFIG = CONFIG;
