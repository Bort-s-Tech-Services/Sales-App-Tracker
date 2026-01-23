# SalesTracker Pro

## Overview
A professional sales tracking application with analytics dashboard. This is a static frontend application that connects to Supabase for backend functionality.

## Project Structure
- `index.html` - Landing page
- `login.html` - User login page
- `register.html` - User registration page
- `dashboard.html` - Main analytics dashboard
- `sales.html` - Sales management page
- `inventory.html` - Inventory management page
- `css/` - Stylesheets (style.css, auth.css)
- `js/` - JavaScript files (auth.js, dashboard.js, inventory.js, sales.js, supabase.js)
- `config.js` - Application configuration

## Tech Stack
- Frontend: HTML, CSS, JavaScript (vanilla)
- Backend: Supabase (authentication and database)
- Serving: Python HTTP server

## Running the Application
The application is served using a Python HTTP server on port 5000:
```
python server.py
```

## Deployment
Configured for static deployment. The entire root directory is served as static files.

## Configuration
Supabase credentials are configured in `js/supabase.js`. The application uses Supabase for:
- User authentication
- Data storage for sales, inventory, and analytics
