# Amazon RDS & DynamoDB Database Setup Guide

This guide details how to provision and initialize the Database Tier for **Sales Tracker Pro** within the **AWS Free Tier**.

---

## Option 1: Amazon RDS PostgreSQL (Recommended for Relational SQL)

### Step 1: Provision RDS Instance in AWS Console
1. Log in to the **AWS Management Console** and navigate to **RDS**.
2. Click **Create database**.
3. Choose **Standard create** -> **PostgreSQL** (or MySQL).
4. Under **Templates**, select **Free tier**.
5. Set:
   - **DB instance identifier**: `sales-tracker-rds`
   - **Master username**: `postgres` (or `dbadmin`)
   - **Master password**: Set a strong password (save it for backend `.env`).
6. Instance Configuration:
   - **DB instance class**: `db.t3.micro` or `db.t4g.micro` (Free Tier eligible).
7. Connectivity:
   - **VPC**: Default VPC.
   - **Publicly Accessible**: Select **Yes** (if connecting directly from EC2/local dev) or **No** (if EC2 is in same VPC).
   - **VPC Security Group**: Create new `rds-sec-group` allowing inbound TCP port `5432` (PostgreSQL) or `3306` (MySQL) from your EC2 Security Group ID.

### Step 2: Initialize Database Schema & Seed Data
Connect to RDS using `psql` or DBeaver / PGAdmin:

```bash
psql -h sales-tracker-rds.c123456789.us-east-1.rds.amazonaws.com -U postgres -d postgres -f database/schema.sql
psql -h sales-tracker-rds.c123456789.us-east-1.rds.amazonaws.com -U postgres -d postgres -f database/seed.sql
```

---

## Option 2: Amazon DynamoDB (NoSQL Alternative)

### Step 1: Provision DynamoDB Tables
1. Go to **DynamoDB Console** -> **Tables** -> **Create table**.
2. Create the following 3 tables with On-Demand or Free Tier (up to 25 WCU/RCU):
   - Table `SalesTracker_Users` (Partition Key: `id` [String])
   - Table `SalesTracker_Products` (Partition Key: `user_id` [String], Sort Key: `id` [String])
   - Table `SalesTracker_Sales` (Partition Key: `user_id` [String], Sort Key: `id` [String])

3. Alternatively, deploy using AWS CLI:
```bash
aws dynamodb create-table --cli-input-json file://database/dynamodb-schema.json
```

---

## Environment Variables Configuration

In `backend/.env`, configure the database connection string:

```env
# For Amazon RDS PostgreSQL
DATABASE_URL=postgresql://postgres:YourPassword@sales-tracker-rds.c123456789.us-east-1.rds.amazonaws.com:5432/postgres

# For Amazon DynamoDB
USE_DYNAMODB=false
AWS_REGION=us-east-1
```
