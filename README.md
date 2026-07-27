# Sales Tracker Pro (CSBC 252 Capstone Project)

[![AWS Architecture](https://img.shields.io/badge/AWS-3--Tier%20Cloud-orange.svg)](https://aws.amazon.com)
[![Express Backend](https://img.shields.io/badge/Node.js-Express.js-green.svg)](https://expressjs.com)
[![Amazon S3](https://img.shields.io/badge/Amazon%20S3-Zero%20Local%20Storage-blue.svg)](https://aws.amazon.com/s3/)
[![Amazon RDS](https://img.shields.io/badge/Amazon%20RDS-PostgreSQL-blue.svg)](https://aws.amazon.com/rds/)

A cloud-native 3-tier sales tracking, inventory management, and financial analytics application designed for **CSBC 252: Introduction to Cloud Computing Capstone Project** using **AWS Free Tier** services (Amazon EC2, Amazon S3, Amazon RDS, IAM, CloudWatch, and Application Load Balancer).

---

## 📁 Repository Structure

```
Sales-App-Tracker/
├── frontend/                     # UI Tier (Presentation Layer)
│   ├── css/                      # Application Stylesheets
│   ├── js/                       # Client Scripts (APIClient, S3Uploader, Auth)
│   ├── static/images/            # Static UI assets
│   ├── index.html                # Landing page
│   ├── login.html                # Login screen
│   ├── register.html             # User registration
│   ├── dashboard.html            # Metrics & sales analytics dashboard
│   ├── inventory.html            # Inventory management & S3 image upload
│   ├── sales.html                # Sales recording & S3 receipt upload
│   ├── reports.html              # Financial summaries & profit reports
│   └── nginx.conf                # Nginx web server config for EC2 frontend proxying
│
├── backend/                      # Cloud Backend Tier (Amazon EC2 Node.js Server)
│   ├── config/                   # Database (db.js) & AWS SDK v3 init (aws.js)
│   ├── middleware/               # Auth middleware & CloudWatch Logger
│   ├── routes/                   # REST API Endpoints (auth, products, sales, reports, upload, health)
│   ├── deploy-ec2.sh             # EC2 automated deployment script
│   ├── sales-backend.service     # Systemd background service unit file
│   ├── Dockerfile                # Docker container configuration
│   ├── docker-compose.yml        # Docker compose container orchestration
│   ├── package.json              # Express, AWS SDK v3, JWT dependencies
│   └── server.js                 # Express server entry point
│
├── database/                     # Database Tier (Amazon RDS / DynamoDB)
│   ├── schema.sql                # SQL schema for Amazon RDS PostgreSQL/MySQL
│   ├── dynamodb-schema.json      # Amazon DynamoDB NoSQL schema definitions
│   ├── seed.sql                  # Initial mock dataset
│   ├── ERD_DIAGRAM.md            # Entity-Relationship Diagram (Mermaid)
│   └── DATABASE_SETUP.md         # Step-by-step AWS RDS & DynamoDB setup guide
│
├── docs/                         # CSBC 252 Capstone Deliverables
│   ├── 01_PROJECT_PROPOSAL.md             # Milestone 1: Project Proposal Document
│   ├── 02_SYSTEM_DESIGN_DOCUMENT.md      # Milestone 2: System Blueprints & AWS Architecture
│   ├── 03_DEPLOYMENT_PROOF_PORTFOLIO.md   # Milestone 3: Proof Portfolio Checklist & Screenshots
│   └── 04_FINAL_TECHNICAL_REPORT.md       # Milestone 4: Comprehensive 15-Page Technical Report
│
└── README.md                     # Top-level capstone project guide
```

---

## ⚡ Quick Start (Local Development)

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm run dev
```
The backend server starts on `http://localhost:5000`. You can test the ALB health check at `http://localhost:5000/api/health`.

### 2. Launch the Frontend
Open `frontend/index.html` in your web browser or serve it using an HTTP server:
```bash
cd frontend
python -m http.server 8000
```
Open `http://localhost:8000` to interact with the application.

---

## ☁️ AWS Free Tier Deployment Guide

### 1. Amazon EC2 Deployment
1. Launch an EC2 `t3.micro` instance running Amazon Linux 2023 or Ubuntu 22.04 LTS.
2. Configure Security Group `ec2-web-sg`:
   - Inbound HTTP Port `80` (0.0.0.0/0)
   - Inbound API Port `5000` (0.0.0.0/0)
3. SSH into EC2 and run the deployment script:
   ```bash
   chmod +x backend/deploy-ec2.sh
   ./backend/deploy-ec2.sh
   ```

### 2. Amazon S3 Object Storage (Zero EC2 Disk Storage)
All uploaded product images and receipt PDFs route programmatically from memory buffers to Amazon S3 bucket `csbc252-sales-tracker-assets`, fulfilling the zero local EC2 storage policy.

### 3. Amazon RDS PostgreSQL Database
Provision an Amazon RDS PostgreSQL `db.t3.micro` instance and execute:
```bash
psql -h <your-rds-endpoint> -U postgres -f database/schema.sql
psql -h <your-rds-endpoint> -U postgres -f database/seed.sql
```

---

## 📋 Capstone Milestones & Deliverables

- **Milestone 1**: [Project Proposal Document](docs/01_PROJECT_PROPOSAL.md)
- **Milestone 2**: [System Design Document](docs/02_SYSTEM_DESIGN_DOCUMENT.md)
- **Milestone 3**: [Deployment Proof Portfolio](docs/03_DEPLOYMENT_PROOF_PORTFOLIO.md)
- **Milestone 4**: [Final Technical Report](docs/04_FINAL_TECHNICAL_REPORT.md)
- **Submission Link**: https://forms.gle/nx6gj1T3geaoPLnQA
- **Deadline**: 25th August, 2026
