# CSBC 252 Capstone Deployment Proof Portfolio

**Course**: CSBC 252 - Introduction to Cloud Computing  
**Project Title**: Sales Tracker Pro AWS Cloud Deployment Proof  
**GitHub Repository URL**: https://github.com/YourGroup/Sales-App-Tracker  

---

## Deployment Proof Verification Checklist

| AWS Component | Required Screenshot Verification Evidence | Verification Status |
| :--- | :--- | :---: |
| **1. IAM Configuration** | Active IAM Role with attached S3 & CloudWatch least-privilege policies | `[REQUIRED]` |
| **2. Amazon EC2 Instance** | Active EC2 instance running in `us-east-1` with Security Group attached | `[REQUIRED]` |
| **3. Security Groups** | Virtual Firewall rules showing Port 80, 5000, 5432 ingress restrictions | `[REQUIRED]` |
| **4. Amazon RDS** | Active RDS PostgreSQL database instance status `Available` | `[REQUIRED]` |
| **5. Amazon S3 Bucket** | Bucket `csbc252-sales-tracker-assets` showing uploaded image/pdf objects | `[REQUIRED]` |
| **6. CloudWatch Metrics** | Log Group `/aws/ec2/sales-app-tracker` showing live stream API metrics | `[REQUIRED]` |

---

## Instructions for Taking & Inserting Verification Screenshots

### Screenshot 1: AWS IAM Roles & Instance Profile
- Navigate to **AWS Console -> IAM -> Roles**.
- Click `SalesTrackerEC2Role`.
- Take a screenshot displaying attached policies: `SalesTrackerS3AccessPolicy` and `SalesTrackerCloudWatchPolicy`.
- Save image as `docs/screenshots/01_iam_role.png`.

### Screenshot 2: Amazon EC2 Running Instance
- Navigate to **AWS Console -> EC2 -> Instances**.
- Highlight your running instance `Sales-Tracker-Backend-EC2` showing IPv4 Public IP and status `Running`.
- Save image as `docs/screenshots/02_ec2_running.png`.

### Screenshot 3: Security Group Rules
- Navigate to **EC2 -> Security Groups -> `ec2-web-sg`**.
- Capture Inbound Rules showing Ports `80` (HTTP), `5000` (Node Backend API), and Port `5432` restricted to EC2 SG.
- Save image as `docs/screenshots/03_security_groups.png`.

### Screenshot 4: Amazon RDS Database Status
- Navigate to **AWS Console -> RDS -> Databases**.
- Capture the database table showing `sales-tracker-rds` instance in status **Available** (`db.t3.micro`).
- Save image as `docs/screenshots/04_rds_instance.png`.

### Screenshot 5: Amazon S3 Objects Storage Proof
- Navigate to **AWS Console -> Amazon S3 -> Buckets -> `csbc252-sales-tracker-assets`**.
- Capture the bucket contents showing subfolders `products/` and `receipts/` with uploaded assets.
- Save image as `docs/screenshots/05_s3_bucket.png`.

### Screenshot 6: CloudWatch Logs & Metrics Collection
- Navigate to **CloudWatch -> Log groups -> `/aws/ec2/sales-app-tracker`**.
- Capture recent log streams showing HTTP status codes (200 OK) and response latency.
- Save image as `docs/screenshots/06_cloudwatch_metrics.png`.
