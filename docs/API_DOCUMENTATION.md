# Sales Tracker Pro — API Documentation

**Base URL (Local):** `http://localhost:5000/api`  
**Base URL (Production):** `http://<EC2_PUBLIC_IP>:5000/api`  
**Auth:** All protected routes require a `Bearer` token in the `Authorization` header.

---

## Health

### GET `/health`

Check if the server is running.

**Auth required:** No

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-07-30T11:16:39.492Z",
  "service": "sales-tracker-backend",
  "awsRegion": "us-east-1",
  "s3Bucket": "csbc252-sales-tracker-assets",
  "uptime": 462.64
}
```

---

## Auth

### POST `/auth/register`

Register a new user.

**Auth required:** No

**Request body:**

```json
{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "company_name": "My Company"
}
```

**Response:**

```json
{
  "message": "Registration successful",
  "token": "<jwt_token>",
  "user": {
    "id": "usr_xxxx",
    "full_name": "Test User",
    "email": "test@example.com"
  }
}
```

---

### POST `/auth/login`

Login with existing credentials.

**Auth required:** No

**Request body:**

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "<jwt_token>",
  "user": {
    "id": "usr_xxxx",
    "full_name": "Test User",
    "email": "test@example.com"
  }
}
```

---

## Products

### GET `/products`

Get all products.

**Auth required:** Yes

**Response:**

```json
{
  "products": [
    {
      "id": "prd_xxxx",
      "product_name": "Test Product",
      "category": "Electronics",
      "quantity": 10,
      "unit_cost": "50.00",
      "selling_price": "80.00"
    }
  ]
}
```

---

### POST `/products`

Add a new product.

**Auth required:** Yes

**Request body:**

```json
{
  "product_name": "Test Product",
  "category": "Electronics",
  "quantity": 10,
  "unit_cost": 50.0,
  "selling_price": 80.0
}
```

**Response:**

```json
{
  "message": "Product created successfully",
  "product": {
    "id": "prd_xxxx",
    "product_name": "Test Product",
    "category": "Electronics",
    "quantity": 10,
    "unit_cost": "50.00",
    "selling_price": "80.00"
  }
}
```

---

### DELETE `/products/:id`

Delete a product by ID.

**Auth required:** Yes

**Response:**

```json
{
  "message": "Product deleted successfully"
}
```

---

## Sales

### GET `/sales`

Get all sales records.

**Auth required:** Yes

**Response:**

```json
{
  "sales": [
    {
      "id": "sale_xxxx",
      "product_id": "prd_xxxx",
      "product_name": "Test Product",
      "quantity": 10,
      "revenue": 1000,
      "cost": 50
    }
  ]
}
```

---

### POST `/sales`

Record a new sale.

**Auth required:** Yes

**Request body:**

```json
{
  "user_id": "usr_xxxx",
  "product_id": "prd_xxxx",
  "product_name": "Test Product",
  "quantity": 10,
  "revenue": 1000,
  "cost": 50
}
```

**Response:**

```json
{
  "message": "Sale recorded successfully"
}
```

---

## Reports

### GET `/reports/summary`

Get a summary report of sales and inventory.

**Auth required:** Yes

**Response:**

```json
{
  "summary": {
    "total_sales": 5,
    "total_revenue": 5000,
    "total_products": 10
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

| Status Code | Meaning                                 |
| ----------- | --------------------------------------- |
| 400         | Bad request — missing or invalid fields |
| 401         | Unauthorized — missing or invalid token |
| 404         | Resource not found                      |
| 500         | Internal server error                   |

---

## How to Authenticate

1. Register or login to get a token
2. Copy the `token` from the response
3. Add it to all protected requests as a header:

```
Authorization: Bearer <your_token_here>
```
