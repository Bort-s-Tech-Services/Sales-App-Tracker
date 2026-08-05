# CSBC 252 Capstone Project Final Technical Report

**Project Title**: Design, Deploy, and Demonstrate a Cloud-Based Sales Management & Analytics Application Using AWS Free Tier  
**Course**: CSBC 252 - Introduction to Cloud Computing  
**Academic Semester**: 2026  
**Submission Deadline**: August 25th, 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Background & Objectives](#2-project-background--objectives)
3. [Cloud System Architecture](#3-cloud-system-architecture)
4. [Backend & API Engineering](#4-backend--api-engineering)
5. [Database Design & RDS Integration](#5-database-design--rds-integration)
6. [Amazon S3 Storage Integration & Zero-Local Storage Policy](#6-amazon-s3-storage-integration--zero-local-storage-policy)
7. [Security & IAM Access Control](#7-security--iam-access-control)
8. [Monitoring & CloudWatch Operations](#8-monitoring--cloudwatch-operations)
9. [Testing & Quality Assurance](#9-testing--quality-assurance)
10. [Implementation Hurdles & Solutions](#10-implementation-hurdles--solutions)
11. [Future Scope & Scaling Considerations](#11-future-scope--scaling-considerations)
12. [Individual Member Contribution Breakdown](#12-individual-member-contribution-breakdown)

---

## 1. Executive Summary

This report documents the design, engineering, cloud deployment, and validation of **Sales Tracker Pro**, a production-grade 3-tier sales tracking application built within the Amazon Web Services (AWS) Free Tier. The solution resolves small retail management challenges by offering dynamic sales recording, inventory tracking, profit margin calculations, automated S3 receipt storage, and CloudWatch operational logging.

---

## 2. Project Background & Objectives

Retail entrepreneurs often rely on fragmented manual logs, resulting in stock loss, inaccurate profit reporting, and lost receipts. **Sales Tracker Pro** addresses this by providing:

- **Responsive 3-Tier Architecture**: Clean separation of Presentation (Frontend), Application (Backend API on EC2), and Storage (RDS PostgreSQL + Amazon S3).
- **AWS Free Tier Adherence**: Zero cost deployment leveraging `t3.micro` EC2 instances, 5 GB S3 storage, 20 GB RDS storage, and CloudWatch logs.
- **Security Compliance**: Encryption in transit, IAM role delegation, and protected environment variables.

---

## 3. Cloud System Architecture

The application adopts an AWS 3-tier architecture:

- **Presentation Layer**: Nginx / Static Web UI delivering responsive screens.
- **Application Layer**: Express.js REST API running on an Amazon EC2 instance (`t3.micro`), supervised by a Systemd service daemon.
- **Data & Object Storage Layer**: Amazon RDS PostgreSQL instance for relational records and Amazon S3 (`csbc252-sales-tracker-assets`) for object storage.

---

## 4. Backend & API Engineering

The backend is built with Node.js & Express.js, providing RESTful endpoints:

- `POST /api/auth/register` & `POST /api/auth/login`: User account management & JWT issuance.
- `GET /api/products`, `POST /api/products`: Inventory CRUD operations.
- `GET /api/sales`, `POST /api/sales`: Sales logging & inventory stock decrement.
- `GET /api/reports/summary`: Aggregated financial metrics (Revenue, Cost, Profit, Average Order Value).
- `POST /api/upload/direct`: Programmatic streaming of asset buffers directly to Amazon S3.

---

## 5. Database Design & RDS Integration

The relational schema comprises `users`, `products`, `sales`, and `uploaded_assets` tables.

- Primary keys use UUID string identifiers.
- Foreign key constraints maintain referential integrity between users, products, and transaction records.
- Indexes on `user_id`, `category`, and `sale_date` optimize analytical query performance.

---

## 6. Amazon S3 Storage Integration & Zero-Local Storage Policy

Per capstone mandate:

> _"Under no circumstances should uploaded user assets be saved directly to the EC2 local storage. They must be programmatically sent to Amazon S3."_

**Technical Implementation**:
Uploads utilize Multer's `memoryStorage()` engine. Uploaded files exist only temporarily in node process memory (RAM buffer) and stream directly to Amazon S3 using AWS SDK v3 `PutObjectCommand`. No temporary files are written to the EC2 filesystem.

---

## 7. Security & IAM Access Control

- **IAM Policies**: Attached instance profiles grant explicit `s3:PutObject` and `cloudwatch:PutLogEvents` permissions.
- **Security Groups**: Port 5432 (RDS) is firewalled to accept connections solely from the EC2 backend SG.
- **Environment Variables**: Sensitive DB passwords and JWT keys are isolated in `.env` files.

---

## 8. Monitoring & CloudWatch Operations

A custom Express middleware intercepts all inbound HTTP requests, formatting latency, status code, IP address, and route details into structured JSON log events posted directly to Amazon CloudWatch Log Group `/aws/ec2/sales-app-tracker`.

---

## 9. Testing & Quality Assurance

- **Unit Testing**: Route handler validation for authentication and CRUD operations.
- **Load & Health Testing**: ALB `/api/health` endpoint monitoring.
- **Security Audit**: Scanned for hardcoded credentials; enforced HTTPS/TLS standards.

---

## 10. Implementation Hurdles & Solutions

10. Implementation Hurdles & Solutions

- Hurdle: On first registration attempt, the backend returned a 500 error with no clear message in the frontend.
  Solution: Investigated backend terminal logs and discovered the users table had not been created on the database. Ran schema.sql against the PostgreSQL instance to create all required tables, after which registration succeeded.

- Hurdle: Frontend HTML files were opened directly via the file:// protocol instead of being served through an HTTP server, causing all API fetch calls to fail with CORS policy errors.
  Solution: Served the frontend using npx serve to assign it a proper http://localhost origin, which resolved the CORS violations and allowed the frontend to communicate with the backend on port 5000.

- Hurdle: The Add Product button on the inventory page produced no response and logged no errors to the browser console.
  Solution: Traced the issue to mismatched HTML element IDs between inventory.html and inventory.js. The JS was referencing addProductForm, addProductModal, and inventoryTableBody which did not exist in the HTML. Updated the JS to match the actual IDs (productForm, productModal, productsTableBody) and wired up the missing button click event listener.

- Hurdle: The DOMContentLoaded callback in inventory.js was not properly closed after commenting out old code, causing all event listeners (button clicks, form submissions) to be defined outside the DOM-ready scope and never execute.
  Solution: Restored the closing }); bracket in the correct position, ensuring all listeners were registered only after the DOM was fully loaded.

- Hurdle: Registration requests from Bruno API client returned a validation error despite the correct payload being sent.
  Solution: Inspected auth.js route handler and found it expected full_name as the field name, not name. Updated all API test requests and frontend forms to use the correct field name.

- Hurdle: Product images in the inventory table failed to load, triggering infinite onerror loops in the browser.
  Solution: The fallback image URL pointed to via.placeholder.com which was unreachable. Replaced the fallback with a local static image and added this.onerror=null to prevent the infinite error loop.

- Hurdle: Multipart file uploads could not be written to EC2 local storage per the capstone mandate.
  Solution: Configured Multer to use memoryStorage() so uploaded files are held temporarily in RAM and streamed directly to Amazon S3 using AWS SDK v3 PutObjectCommand, leaving no files on the EC2 filesystem.

- Hurdle: RDS connection from the backend initially failed after switching from local PostgreSQL.
  Solution: Confirmed the RDS Security Group allowed inbound traffic on port 5432 from the EC2 instance, and verified the DATABASE_URL environment variable was correctly formatted with the RDS endpoint.

- Hurdle: Implementing a forgot password flow required AWS SES email delivery, but the EC2 instance could not reach the RDS database due to a cross-region networking issue (EC2 in eu-north-1, RDS in eu-central-1).
  Solution: Enabled public accessibility on the RDS instance, added the EC2 public IP (16.170.251.127/32) as an inbound rule on the RDS security group for port 5432, and set sslmode=no-verify in the DATABASE_URL. A password_reset_tokens table was created to store time-limited tokens (15-minute expiry). Two endpoints were added to auth.js: POST /api/auth/forgot-password generates a secure token and sends a reset link via AWS SES, and POST /api/auth/reset-password validates the token and updates the user's password hash.

---

## 11. Future Scope & Scaling Considerations

- Application Load Balancer (ALB) auto-scaling group integration across multiple Availability Zones (AZs).
- CloudFront CDN distribution for static frontend asset delivery.
- Redis ElastiCache session layer integration.

---

## 12. Individual Member Contribution Breakdown

| Student Name | Student ID | Explicit Engineering Contribution                                | Video Timestamp |
| :----------- | :--------- | :--------------------------------------------------------------- | :-------------- |
| Member 1     | 109XXXX1   | Designed frontend UI, responsive layouts, API client             | 00:00 - 03:15   |
| Member 2     | 109XXXX2   | Developed Express REST endpoints, JWT auth, business logic       | 03:15 - 06:30   |
| Member 3     | 109XXXX3   | Provisioned AWS EC2, Security Groups, ALB, Nginx reverse proxy   | 06:30 - 09:45   |
| Member 4     | 109XXXX4   | Built Amazon RDS PostgreSQL schemas, seed data, SQL indexing     | 09:45 - 13:00   |
| Member 5     | 109XXXX5   | Implemented AWS SDK S3 streaming & zero local disk storage logic | 13:00 - 16:15   |
| Member 6     | 109XXXX6   | Configured CloudWatch logs middleware & deployment portfolio     | 16:15 - 19:30   |
