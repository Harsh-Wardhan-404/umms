# User Management API Documentation

## Overview
This document describes the User Management API endpoints for the UMMS Backend system.

**Base URL**: `http://localhost:3000/api/users`

**Authentication**: All endpoints require JWT token authentication with Admin role.

---

## Endpoints

### 1. Get All Users

**GET** `/api/users`

Retrieves a paginated list of all users in the system.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `search` (optional) - Search by first name, last name, email, or username
- `role` (optional) - Filter by user role
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)

**Response (200):**
```json
{
  "users": [
    {
      "id": "cm123abc",
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Staff",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/users?search=john&page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get User by ID

**GET** `/api/users/:id`

Retrieves detailed information about a specific user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` - User ID (in URL path)

**Response (200):**
```json
{
  "id": "cm123abc",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Staff",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**
- `404` - User not found
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not Admin role)

---

### 3. Create New User

**POST** `/api/users`

Creates a new user (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "Staff",
  "username": "janesmith"
}
```

**Required Fields:**
- `email` - Valid email address
- `password` - Minimum 6 characters
- `firstName` - User's first name
- `lastName` - User's last name

**Optional Fields:**
- `role` - One of: Admin, InventoryManager, ProductionManager, Supervisor, Staff (default: Staff)
- `username` - Username (default: derived from email)

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "cm123xyz",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "Staff",
    "username": "janesmith",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid email, weak password, duplicate email/username)
- `401` - Unauthorized
- `403` - Forbidden (not Admin role)
- `500` - Server error

---

### 4. Update User

**PUT** `/api/users/:id`

Updates an existing user's information.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Parameters:**
- `id` - User ID (in URL path)

**Request Body:**
```json
{
  "email": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "Supervisor",
  "username": "janedoe",
  "password": "newpassword123"
}
```

**All fields are optional:**
- `email` - New email address (must be unique)
- `firstName` - Updated first name
- `lastName` - Updated last name
- `role` - Updated role
- `username` - New username (must be unique)
- `password` - New password (min 6 characters, leave blank to keep current)

**Response (200):**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "cm123abc",
    "email": "updated@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "Supervisor",
    "username": "janedoe",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error (duplicate email/username)
- `404` - User not found
- `401` - Unauthorized
- `403` - Forbidden (not Admin role)

---

### 5. Delete User

**DELETE** `/api/users/:id`

Deletes a user from the system.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` - User ID (in URL path)

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `400` - Cannot delete your own account
- `404` - User not found
- `401` - Unauthorized
- `403` - Forbidden (not Admin role)

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/users/cm123abc \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## User Roles

The system supports the following user roles:
- **Admin** - Full system access
- **InventoryManager** - Inventory and stock management
- **ProductionManager** - Production and batch management
- **Supervisor** - Team supervision and batch oversight
- **Staff** - Basic user access

---

## Security Notes

1. **Authentication Required**: All endpoints require a valid JWT token
2. **Admin Only**: All user management operations are restricted to Admin users
3. **Password Security**: Passwords are hashed using bcrypt with 10 salt rounds
4. **Self-Protection**: Users cannot delete their own account
5. **Unique Constraints**: Email and username must be unique across all users

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Frontend Integration

The frontend Staff page has been integrated with these endpoints:

- **List Users**: Fetches and displays all users with search functionality
- **Create User**: Modal form to create new users
- **Update User**: Modal form to edit existing users
- **Delete User**: Confirmation modal to delete users

All operations automatically refresh the user list after completion.

