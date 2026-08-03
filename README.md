# Sales Tracker Pro — Backend

[![Node.js](https://img.shields.io/badge/Node.js-Express.js-green.svg)](https://expressjs.com)
[![Amazon RDS](https://img.shields.io/badge/Amazon%20RDS-PostgreSQL-blue.svg)](https://aws.amazon.com/rds/)
[![Amazon S3](https://img.shields.io/badge/Amazon%20S3-File%20Storage-orange.svg)](https://aws.amazon.com/s3/)
[![CloudWatch](https://img.shields.io/badge/CloudWatch-Logging-yellow.svg)](https://aws.amazon.com/cloudwatch/)

REST API backend for Sales Tracker Pro — a cloud-native sales tracking and inventory management application. Built with Node.js and Express, deployed on Amazon EC2, with Amazon RDS PostgreSQL as the database and Amazon S3 for file storage.

---

## Folder Structure

```
backend/
├── config/                  # Database and AWS SDK configuration
│   ├── db.js                # PostgreSQL connection pool (RDS)
│   └── aws.js               # AWS SDK v3 initialization (S3, CloudWatch)
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── cloudwatchLogger.js  # AWS CloudWatch request logging
├── routes/
│   ├── health.js            # GET /api/health
│   ├── auth.js              # POST /api/auth/register, /api/auth/login
│   ├── products.js          # GET, POST, DELETE /api/products
│   ├── sales.js             # GET, POST /api/sales
│   ├── reports.js           # GET /api/reports/summary
│   └── upload.js            # POST /api/upload
├── deploy-ec2.sh            # Automated EC2 deployment script
├── sales-backend.service    # Systemd service file for EC2
├── Dockerfile               # Docker container configuration
├── docker-compose.yml       # Docker Compose orchestration
├── package.json
└── server.js                # Express server entry point
```

---

## Prerequisites

- Node.js v18+
- PostgreSQL (local or Amazon RDS)
- AWS account with S3 and CloudWatch access

---

## Local Setup

**1. Clone the repo and navigate to backend:**
```bash
git clone https://github.com/DonBort/Sales-App-Tracker.git
cd Sales-App-Tracker/backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create a `.env` file:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/sales_tracker
JWT_SECRET=your_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket_name
PORT=5000
```

**4. Set up the database:**

Run the schema and seed files from the `database/` folder in pgAdmin or psql:
```bash
psql -U postgres -d sales_tracker -f ../database/schema.sql
psql -U postgres -d sales_tracker -f ../database/seed.sql
```

**5. Start the server:**
```bash
npm run start
```

Server runs on `http://localhost:5000`. Test it:
```bash
curl http://localhost:5000/api/health
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Server and DB health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and get JWT token |
| GET | `/api/products` | Yes | Get all products |
| POST | `/api/products` | Yes | Add a new product |
| DELETE | `/api/products/:id` | Yes | Delete a product |
| GET | `/api/sales` | Yes | Get all sales records |
| POST | `/api/sales` | Yes | Record a new sale |
| GET | `/api/reports/summary` | Yes | Get sales and revenue summary |
| POST | `/api/upload` | Yes | Upload file to Amazon S3 |

Full request/response details are in `docs/API_DOCUMENTATION.md`.

---

## AWS Services Used

- **Amazon EC2** — Hosts the Node.js backend server
- **Amazon RDS (PostgreSQL)** — Managed relational database
- **Amazon S3** — File and image storage
- **AWS CloudWatch** — Request logging and monitoring
- **IAM** — Role-based access control for AWS services

---

## Deployment on EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Run the deployment script
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

The `sales-backend.service` file keeps the server running as a background systemd service on EC2.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (e.g. us-east-1) |
| `S3_BUCKET_NAME` | S3 bucket name for file uploads |
| `PORT` | Server port (default: 5000) |

---

## Author

Maxwell — Backend Developer  
CSBC 252: Introduction to Cloud Computing
