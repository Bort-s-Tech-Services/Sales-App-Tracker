# Database Entity-Relationship Diagram (ERD) - Sales Tracker Pro

This document outlines the Database Entity-Relationship Diagram (ERD) for the **Sales Tracker Pro** cloud application as part of the CSBC 252 Capstone Project.

## ERD Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : "owns/manages"
    USERS ||--o{ SALES : "records/owns"
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
        datetime created_at
        datetime updated_at
    }

    PRODUCTS {
        string id PK
        string user_id FK
        string product_name
        string category
        integer quantity
        decimal unit_cost
        decimal selling_price
        string sku
        string description
        string image_s3_url
        datetime created_at
        datetime updated_at
    }

    SALES {
        string id PK
        string user_id FK
        string product_id FK
        string product_name
        string category
        integer quantity
        decimal revenue
        decimal cost
        decimal profit
        string customer_name
        date sale_date
        string receipt_s3_url
        string notes
        datetime created_at
    }

    UPLOADED_ASSETS {
        string id PK
        string user_id FK
        string s3_key
        string s3_bucket
        string file_name
        string file_type
        bigint file_size_bytes
        string s3_url
        datetime uploaded_at
    }
```

## Entity Descriptions

### 1. `USERS`
Stores application user accounts, credentials (hashed using bcrypt), profile details, and S3 avatar storage URLs.

### 2. `PRODUCTS`
Manages inventory items. Each item belongs to a specific user, includes stock counts, pricing, cost tracking, and an S3 product image URL.

### 3. `SALES`
Records transaction logs. Computes `profit = revenue - cost` dynamically. Connects optionally to `PRODUCTS` and stores an S3 uploaded receipt URL.

### 4. `UPLOADED_ASSETS`
Tracks all files programmatically sent to Amazon S3 (bucket name, object key, file mime-type, and public/presigned URL), maintaining zero file footprint on EC2 local storage.
