# CSBC 252 Capstone Project Proposal: Sales Tracker Pro

**Course**: CSBC 252 - Introduction to Cloud Computing  
**Project Title**: Design, Deploy, and Demonstrate a Cloud-Based Sales Management & Analytics Application Using AWS Free Tier  
**Submission Deadline**: August 25th, 2026  
**Submission Link**: https://forms.gle/nx6gj1T3geaoPLnQA  

---

## 1. Executive Summary & Problem Statement

Small to medium enterprises (SMEs) and modern retail businesses frequently struggle with real-time inventory management, sales record keeping, financial reporting, and secure document storage. Traditional manual bookkeeping leads to inventory discrepancies, data loss, and an inability to forecast growth.

**Sales Tracker Pro** is a cloud-native, 3-tier sales tracking and inventory management solution built on Amazon Web Services (AWS) Free Tier. It provides dynamic sales logging, inventory management, automated profit calculations, secure PDF receipt storage on Amazon S3, and CloudWatch monitoring.

---

## 2. Group Composition & Role Allocation

| Group Member Name | Role & Responsibility | Key Deliverables |
| :--- | :--- | :--- |
| **Member 1** | **Frontend Developer** | Responsive UI (HTML/CSS/JS), API integration, asset upload forms |
| **Member 2** | **Backend Developer** | Node.js Express REST API, JWT auth, business logic endpoints |
| **Member 3** | **Cloud Architect** | AWS EC2 provision, Security Groups, IAM Roles, ALB & Nginx setup |
| **Member 4** | **Database Administrator (DBA)** | Amazon RDS PostgreSQL schema, indexing, query optimization, DynamoDB |
| **Member 5** | **QA & Security Specialist** | Least-privilege IAM policies, environment secrets management, test suite |
| **Member 6** | **DevOps & Documentation Specialist** | CloudWatch log streaming, deployment portfolio, final technical report |

---

## 3. Targeted AWS Services & Tech Stack

### AWS Cloud Architecture (AWS Free Tier Compliant)
- **Identity & Access Management (IAM)**: Least-privilege roles for EC2, RDS, and S3 access.
- **Amazon EC2 (`t3.micro` / `t4g.micro`)**: Hosts the Node.js Express backend and Nginx web server.
- **Security Groups**: Virtual firewalls isolating Port 80 (HTTP), 443 (HTTPS), 5000 (Backend API), and 5432 (RDS Database).
- **Amazon RDS (PostgreSQL)**: Managed relational database for relational sales and inventory records.
- **Amazon S3 (`csbc252-sales-tracker-assets`)**: Secure object storage for product images and receipt PDFs. Zero files stored on EC2 disk.
- **Amazon CloudWatch**: Log groups `/aws/ec2/sales-app-tracker` and server metric alarms.
- **Application Load Balancer (ALB)** (Optional/Bonus): Elastic traffic distribution across EC2 instances.

### Software Stack
- **Frontend**: HTML5, CSS3 (Vanilla design system), Modern JavaScript (ES6+), FontAwesome.
- **Backend**: Node.js, Express.js, AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/client-cloudwatch-logs`), JWT, Multer (Memory Storage).
- **Database**: PostgreSQL (Amazon RDS) / DynamoDB (NoSQL option).

---

## 4. Key Objectives & Project Outcomes

1. **Real-World Impact**: Empowers retail businesses to track real-time revenue, profit margins, and stock levels.
2. **Cloud-Native Deployment**: Fully hosted on AWS Free Tier infrastructure, publicly accessible with domain/IP.
3. **Security First**: Protected environment variables (`.env`), salted bcrypt password hashes, JWT authorization.
4. **Pure S3 Asset Storage**: Direct streaming of uploads to S3 buckets, satisfying strict EC2 zero-local-file storage policy.
