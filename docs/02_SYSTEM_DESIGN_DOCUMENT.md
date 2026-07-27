# CSBC 252 Capstone System Design Document: Sales Tracker Pro

## 1. AWS 3-Tier Architecture Diagram

```mermaid
flowchart TD
    Client[User Web Browser / Client]
    
    subgraph AWS_Cloud["AWS Cloud Ecosystem (Free Tier)"]
        subgraph Public_Subnet["Public Subnet / Internet Facing"]
            ALB["Application Load Balancer (ALB)"]
            Nginx["Nginx Web Server / Static Host"]
        end
        
        subgraph App_Tier["Application Tier (Amazon EC2 - t3.micro)"]
            ExpressApp["Node.js Express REST API Server (Port 5000)"]
            CloudWatchMiddleware["CloudWatch Logging Middleware"]
            S3Streamer["Multer RAM Buffer / S3 SDK v3 Streamer"]
        end
        
        subgraph Data_Tier["Database & Object Storage Tier"]
            RDS[("Amazon RDS PostgreSQL Instance")]
            S3Bucket[("Amazon S3 Bucket: csbc252-sales-tracker-assets")]
        end
        
        subgraph Monitoring_Security["Monitoring & IAM Security"]
            IAM["IAM Roles & Instance Profiles"]
            CloudWatch["Amazon CloudWatch Log Group"]
            SecGroup["VPC Security Groups (Port 80, 5000, 5432)"]
        end
    end
    
    Client -->|HTTP / HTTPS| ALB
    ALB -->|Port 80/443| Nginx
    Nginx -->|Reverse Proxy /api| ExpressApp
    ExpressApp --> CloudWatchMiddleware
    CloudWatchMiddleware -->|Log Events| CloudWatch
    ExpressApp -->|SQL Queries| RDS
    S3Streamer -->|Direct Stream Uploads| S3Bucket
    ExpressApp --- IAM
    ExpressApp --- SecGroup
```

---

## 2. Use Case Diagram & Flow

```mermaid
usecaseDiagram
    actor Merchant as "Store Merchant / User"
    actor Admin as "System Admin"
    
    package "Sales Tracker Pro System" {
        usecase "Authenticate (Register/Login)" as UC1
        usecase "Manage Inventory (Create, Read, Update, Delete)" as UC2
        usecase "Upload Product Image to Amazon S3" as UC3
        usecase "Record Sale Transaction" as UC4
        usecase "Upload Receipt PDF to Amazon S3" as UC5
        usecase "View Financial Dashboard & Profit Reports" as UC6
        usecase "Monitor Application Health & CloudWatch Logs" as UC7
    }
    
    Merchant --> UC1
    Merchant --> UC2
    Merchant --> UC3
    Merchant --> UC4
    Merchant --> UC5
    Merchant --> UC6
    
    Admin --> UC1
    Admin --> UC7
```

---

## 3. Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : "manages"
    USERS ||--o{ SALES : "records"
    USERS ||--o{ UPLOADED_ASSETS : "uploads"
    PRODUCTS ||--o{ SALES : "referenced in"

    USERS {
        string id PK
        string full_name
        string email UK
        string password_hash
        string company_name
        string role
        string avatar_s3_url
    }

    PRODUCTS {
        string id PK
        string user_id FK
        string product_name
        string category
        integer quantity
        decimal unit_cost
        decimal selling_price
        string image_s3_url
    }

    SALES {
        string id PK
        string user_id FK
        string product_id FK
        string product_name
        integer quantity
        decimal revenue
        decimal cost
        decimal profit
        string receipt_s3_url
    }

    UPLOADED_ASSETS {
        string id PK
        string s3_key
        string s3_bucket
        string file_name
        string s3_url
    }
```

---

## 4. Security & Network Isolation Specifications

1. **Security Groups**:
   - `ec2-web-sg`: Inbound TCP 80, 443, 5000 from 0.0.0.0/0.
   - `rds-db-sg`: Inbound TCP 5432 restricted strictly to `ec2-web-sg` ID.
2. **IAM Least Privilege Policy**:
   - Policy `SalesTrackerS3AccessPolicy`: Allows `s3:PutObject`, `s3:GetObject`, `s3:ListBucket` strictly for `arn:aws:s3:::csbc252-sales-tracker-assets/*`.
   - Policy `SalesTrackerCloudWatchPolicy`: Allows `logs:CreateLogStream`, `logs:PutLogEvents`.
3. **Data Protection**:
   - Environment secrets passed securely via systemd environment parameters or AWS Secrets Manager.
