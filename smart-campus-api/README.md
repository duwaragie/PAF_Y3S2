# Smart Campus API - Authentication Module

## Phase 1: Google OAuth2 + JWT Authentication

This is the authentication and authorization module for the Smart Campus Operations Hub (IT3030 - PAF 2026).

## Tech Stack
- Java 17
- Spring Boot 4.0.4
- PostgreSQL
- Maven
- JWT (jjwt 0.11.5)
- Spring Security with OAuth2

## Project Structure
```
com.smartcampus.api/
├── config/
│   └── SecurityConfig.java          # Security configuration with OAuth2 + JWT
├── controller/
│   └── AuthController.java          # Auth endpoints
├── dto/
│   ├── TokenResponse.java           # JWT token response
│   ├── UserDTO.java                 # User data transfer object
│   └── ErrorResponse.java           # Error response
├── exception/
│   └── GlobalExceptionHandler.java  # Global exception handling
├── model/
│   ├── User.java                    # User entity
│   └── Role.java                    # Role enum (STUDENT, ADMIN, LECTURER)
├── repository/
│   └── UserRepository.java          # User data access
├── security/
│   ├── JwtService.java              # JWT generation & validation
│   ├── JwtAuthFilter.java           # JWT authentication filter
│   ├── CustomOAuth2UserService.java # OAuth2 user service
│   ├── CustomOAuth2User.java        # OAuth2 user wrapper
│   └── OAuth2SuccessHandler.java    # OAuth2 success handler
├── service/
│   └── UserService.java             # User business logic
└── ApiApplication.java              # Main application
```

## Setup Instructions

### 1. Database Setup
Create a PostgreSQL database:
```sql
CREATE DATABASE smartcampus;
```

### 2. Google OAuth2 Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8080/oauth2/callback/google`
   - `http://localhost:8080/login/oauth2/code/google`
7. Copy Client ID and Client Secret

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

Edit `.env`:
```properties
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET_KEY=your_256_bit_secret_key_here_at_least_32_characters_long
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Generate JWT Secret:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Run the Application
```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or using Maven directly
mvn spring-boot:run
```

The API will start on `http://localhost:8080`

## API Endpoints

### Public Endpoints
- `GET /api/auth/login` - Get OAuth2 login URL
- `GET /oauth2/authorization/google` - Initiate Google OAuth2 login

### Protected Endpoints
- `GET /api/auth/status` - Get current user info (requires JWT token)
- `GET /api/**` - All API routes require authentication
- `GET /api/admin/**` - Admin-only routes (requires ADMIN role)

## OAuth2 Flow

1. Frontend redirects user to: `http://localhost:8080/oauth2/authorization/google`
2. User authenticates with Google
3. Google redirects to Spring with authorization code
4. `CustomOAuth2UserService` processes user info:
   - Creates new user if not exists (with role=STUDENT)
   - Updates existing user's name and picture
5. `OAuth2SuccessHandler` generates JWT and redirects to frontend:
   - `http://localhost:5173/auth/callback?token=eyJ...`
6. Frontend stores JWT and uses it for subsequent API calls

## Using JWT Token

After OAuth2 login, include the JWT token in API requests:
```
Authorization: Bearer <your_jwt_token>
```

Example:
```bash
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:8080/api/auth/status
```

## JWT Token Contents
The JWT contains:
- `subject`: User's email
- `userId`: User's database ID
- `role`: User's role (STUDENT, ADMIN, LECTURER)
- `exp`: Expiration time (24 hours from issuance)

## CORS Configuration
The API allows requests from `http://localhost:5173` (frontend URL).
Update `SecurityConfig.java` to add more origins if needed.

## Database Schema
The `users` table is created automatically with:
- `id` (Primary Key)
- `email` (Unique, Not Null)
- `name`
- `picture`
- `google_id`
- `role` (Default: STUDENT)
- `created_at`
- `updated_at`

## Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- CORS protection
- Stateless sessions
- OAuth2 with Google

## Next Steps (Future Phases)
- Phase 2: Username/Password authentication
- Phase 3: OTP-based authentication
- Phase 4: Multi-factor authentication (MFA)

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check database name, username, and password in `.env`
- Ensure database `smartcampus` exists

### OAuth2 Error
- Verify Google Client ID and Secret in `.env`
- Check authorized redirect URIs in Google Console
- Ensure URIs match exactly (including trailing slashes)

### JWT Error
- Verify JWT secret is at least 32 characters long
- Check token is being sent in `Authorization: Bearer <token>` format
- Token expires after 24 hours - get a new one if expired

## Author
IT3030 - PAF 2026 Project
