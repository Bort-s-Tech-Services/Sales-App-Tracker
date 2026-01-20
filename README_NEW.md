# 📊 Sales Tracker Pro

A production-ready sales tracking web application with inventory management, secure authentication, and real-time analytics.

## ✨ Features

### 📈 Sales Tracking
- **Daily Sales Monitoring** - Track sales in real-time
- **Automatic Profit Calculation** - Revenue - Cost = Profit  
- **Multiple Time Periods** - Day, Week, Month, Year analysis
- **Visual Analytics** - Interactive charts and graphs

### 📦 Inventory Management
- **Product Management** - Add, edit, delete products
- **Stock Tracking** - Monitor inventory levels
- **Low Stock Alerts** - Get notified of low inventory
- **Automatic Deduction** - Stock decreases when sales are recorded

### 🔐 Security
- **Secure Authentication** - Email/password with Supabase
- **Row Level Security** - Each user sees only their data
- **Environment Variables** - Secure credential management
- **HTTPS Ready** - Deploy with auto SSL

### 📱 Responsive Design
- **Mobile Optimized** - Works on phones, tablets, desktops
- **Touch Friendly** - 44px touch targets for accessibility
- **Offline Ready** - Progressive enhancement
- **Fast Performance** - Optimized for all devices

### 🚀 Production Ready
- **Netlify/Vercel Ready** - One-click deployment
- **Static Hosting** - No server required
- **CDN Optimized** - Global delivery
- **Analytics Integration** - Track app usage

## 📋 Database Schema

### Products Table
Manages inventory and product information.
```
- id: Auto-increment ID
- product_name: Product name (unique per user)
- quantity: Current stock level
- unit_cost: Cost per unit (GHS ₵)
- category: Product category
- sku: Product SKU (optional)
- description: Product description
- user_id: Owner (from auth)
- created_at: Creation date
- updated_at: Last modified date
```

### Sales Table
Tracks all transactions.
```
- id: Auto-increment ID
- product_id: Reference to product
- product_name: Product name
- quantity: Units sold
- revenue: Total sales (GHS ₵)
- cost: Total cost (GHS ₵)
- profit: Auto-calculated profit
- date: Sale date
- category: Product category
- customer: Customer name
- notes: Additional notes
- user_id: Owner (from auth)
- created_at: Record date
```

## 🚀 Quick Start

### Prerequisites
- Supabase account (free at https://supabase.com)
- Web browser with JavaScript enabled
- Text editor for configuration

### Step 1: Setup Supabase Database

1. Create a Supabase project at https://supabase.com
2. Go to **SQL Editor** in your project
3. Create new query and paste contents of `supabase-setup.sql`
4. Click **Run**
5. Wait for "Success" message

**For detailed instructions, see [DATABASE_SETUP.md](DATABASE_SETUP.md)**

### Step 2: Configure Credentials

Update `.env` file with your Supabase details:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
APP_NAME=SalesTracker Pro
APP_VERSION=1.0.0
APP_ENV=production
SESSION_DURATION=7
ENABLE_HTTPS=true
ENABLE_DEMO_MODE=true
ENABLE_OFFLINE_MODE=true
ENABLE_ANALYTICS=true
DEMO_EMAIL=demo@example.com
DEMO_PASSWORD=demo123
```

### Step 3: Open the App

**Option A: Direct Open**
```bash
# Simply open index.html in your browser
```

**Option B: Local Server**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (with http-server)
npx http-server
```

Then visit: `http://localhost:8000`

### Step 4: Create Account & Start Using

1. Go to Register page
2. Create your account
3. Login with your credentials
4. Add products to inventory
5. Record sales
6. View dashboard analytics

## 📖 Usage Guide

### Adding Products
1. Go to **Inventory** page
2. Click **Add Product**
3. Enter:
   - Product Name (required)
   - Category (optional)
   - Quantity (required)
   - Unit Cost (required)
4. Click **Save Product**

### Recording Sales
1. Go to **Add Sales** page
2. Select product from dropdown
3. Enter:
   - Quantity sold
   - Unit Price
   - Customer (optional)
   - Notes (optional)
4. Click **Submit**
5. Inventory automatically decreases

### Viewing Analytics
1. Go to **Dashboard**
2. View:
   - Today's revenue
   - Weekly profit
   - Monthly sales
   - Year growth
   - Best selling products
   - Recent transactions

## 🔒 Security Considerations

### Row Level Security (RLS)
- All data is isolated per user
- Users cannot see other users' data
- Enforced at database level

### Authentication
- Secure email/password authentication
- Session-based access
- Automatic logout after inactivity

### Environment Variables
- Never commit `.env` to version control
- Use different keys for dev/production
- Rotate keys regularly

## 🌐 Deployment

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/DonBort/Sales-App-Tracker)

1. Click deploy button
2. Connect GitHub account
3. Update environment variables
4. Deploy!

### Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import this repository
4. Add environment variables
5. Click Deploy

### Other Platforms
- GitHub Pages (static only)
- Render
- Railway
- Fly.io

## 🛠️ Development

### Project Structure
```
sales-tracker/
├── index.html              # Landing page
├── dashboard.html          # Main dashboard
├── sales.html             # Sales entry page
├── inventory.html         # Inventory management
├── login.html             # Login page
├── register.html          # Registration page
├── .env                   # Configuration (create this)
├── .env.example           # Example config
├── config.js              # App configuration
├── supabase-setup.sql     # Database schema
├── DATABASE_SETUP.md      # Database guide
├── css/
│   ├── style.css          # Main styles
│   └── auth.css           # Auth page styles
└── js/
    ├── supabase.js        # Supabase client
    ├── auth.js            # Authentication
    ├── dashboard.js       # Dashboard logic
    ├── sales.js           # Sales logic
    └── inventory.js       # Inventory logic
```

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Hosting**: Netlify/Vercel/Static hosting

## 📊 API Reference

### Key Functions

**Authentication**
```javascript
import { supabase } from './js/supabase.js';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
    email, password
});

// Register
const { data, error } = await supabase.auth.signUp({
    email, password
});

// Logout
await supabase.auth.signOut();
```

**Products**
```javascript
import { getProductsByUser, decreaseProductStock } from './js/inventory.js';

// Get all products
const products = await getProductsByUser(userId);

// Decrease stock on sale
await decreaseProductStock(productId, quantity, userId);
```

**Currency Formatting**
```javascript
import { formatCurrency } from './js/supabase.js';

const ghc = formatCurrency(1234.56);
// Returns: "₵1,234.56"
```

## 🐛 Troubleshooting

### "Connection failed"
- Check SUPABASE_URL and SUPABASE_KEY in .env
- Verify database is running in Supabase
- Check browser console for errors (F12)

### "Permission denied"
- Ensure Row Level Security policies are enabled
- Check that supabase-setup.sql was fully executed
- Verify you're logged in

### Products not saving
- Clear browser cache
- Check localStorage in DevTools
- Verify network requests in Network tab

### Inventory not updating
- Page may need refresh
- Check that product exists
- Verify sale was recorded in database

### Mobile app not working
- Check viewport meta tag
- Verify responsive CSS is loading
- Test on actual mobile device

## 📈 Performance Tips

1. Use database indexes (already configured)
2. Limit queries with WHERE clauses
3. Archive old data monthly
4. Enable browser caching
5. Optimize images (under 100KB)

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Submit pull request

## 📞 Support

- **Documentation**: See [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Issues**: Check GitHub Issues
- **Supabase Help**: https://supabase.com/docs

## 🎯 Roadmap

- [ ] Multi-currency support
- [ ] Advanced reporting
- [ ] CSV export
- [ ] Mobile app (React Native)
- [ ] Recurring sales
- [ ] Inventory alerts
- [ ] Team collaboration
- [ ] Payment integration

## ⭐ Features Implemented

- ✅ User authentication
- ✅ Inventory management
- ✅ Sales tracking
- ✅ Real-time analytics
- ✅ Responsive design
- ✅ Mobile optimized
- ✅ Ghana Cedi (₵) currency
- ✅ Row Level Security
- ✅ One-click deployment
- ✅ Dark/light mode ready

---

**Made with ❤️ for Ghana's entrepreneurs**

Last updated: January 20, 2026
