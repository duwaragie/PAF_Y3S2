# Smart Campus API Database Documentation

This document outlines the current database schema for the Smart Campus API service. The database consists of three main entities handling user management, authentication sessions, and OTP-based verification.

## Tables Overview

### 1. Table: `users`
**Entity**: `User`
Handles all primary user account data including local and OAuth details.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Long (BIGINT) | **Primary Key**, Auto-increment | Unique identifier for a user |
| `email` | String | Unique, Not Null | User's email address |
| `name` | String | | User's full name |
| `picture` | String | | URL to user's profile picture |
| `googleId` | String | | Google OAuth identifier |
| `password` | String | | Hashed password (for local auth) |
| `authProvider` | Enum/Varchar | Not Null, Default: `LOCAL` | Authentication method (`LOCAL`, `GOOGLE`, `BOTH`) |
| `isEmailVerified`| Boolean | Not Null, Default: `false` | Flag indicating if email is verified |
| `role` | Enum/String | Not Null, Default: `STUDENT` | User's system role (`STUDENT`, `ADMIN`, `LECTURER`) |
| `createdAt` | DateTime | Auto-generated, Not updatable | Timestamp of account creation |
| `updatedAt` | DateTime | Auto-updated | Timestamp of last modification |

### 2. Table: `refresh_tokens`
**Entity**: `RefreshToken`
Manages long-lived authentication sessions allowing users to securely obtain new access tokens.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Long (BIGINT) | **Primary Key**, Auto-increment | Unique identifier for a token record |
| `user_id` | Long (BIGINT) | **Foreign Key** (`users.id`) | One-to-One mapping to the owning `User` |
| `token` | String | Unique, Not Null | The secure refresh token string |
| `expiryDate` | Instant | Not Null | Timestamp when the token expires |

### 3. Table: `otp_tokens`
**Entity**: `OtpToken`
Manages short-lived One Time Passwords (OTPs) used for email verification or password resets.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Long (BIGINT) | **Primary Key**, Auto-increment | Unique identifier for an OTP record |
| `user_id` | Long (BIGINT) | **Foreign Key** (`users.id`) | Many-to-One mapping to the target `User` |
| `otpCode` | String | Not Null | The securely generated OTP string |
| `expiryDate` | DateTime | Not Null | Timestamp when the OTP expires |
| `tempPassword` | String | Nullable | Optional field to hold pending password updates |
| `createdAt` | DateTime | Auto-generated, Not updatable | Timestamp when OTP was generated |
