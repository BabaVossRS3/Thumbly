# Admin Panel Setup Guide

## Overview
The Thumbly admin panel uses JWT-based authentication with environment variables for credentials.

## Environment Variables

Add the following to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=thumbly_admin_jwt_secret_key_2024_secure_token

# Admin Credentials
ADMIN_EMAIL=thumbly@hotmail.com
ADMIN_PASSWORD=A96ee52cb4
ADMIN_NAME=Thumbly Admin
```

## Setup Instructions

### 1. Backend Setup

#### Step 1: Install Dependencies
```bash
cd backend
npm install
```

#### Step 2: Configure Environment Variables
Make sure your `.env` file includes the admin credentials (see above).

#### Step 3: Seed Admin User
Run the seed script to create the admin user in the database:

```bash
npm run seed:admin
```

This will:
- Check if the admin user already exists
- Create a new admin user with the credentials from `.env`
- Hash the password securely using bcrypt
- Set the role to `super_admin`

#### Step 4: Start the Backend Server
```bash
npm run server
```

The backend will be running on `http://localhost:3000`

### 2. Frontend Setup

#### Step 1: Install Dependencies
```bash
cd admin
npm install
```

#### Step 2: Configure API URL (Optional)
The frontend is configured to use `http://localhost:3000` by default. If you need to change this, create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

#### Step 3: Start the Frontend
```bash
npm run dev
```

The admin panel will be running on `http://localhost:5174`

## Login Credentials

Use these credentials to login to the admin panel:

- **Email**: `thumbly@hotmail.com`
- **Password**: `A96ee52cb4`

## API Endpoints

### Public Endpoints
- `POST /api/admin/auth/login` - Admin login (returns JWT token)

### Protected Endpoints (Require JWT Token)
- `GET /api/admin/auth/verify` - Verify admin token
- `POST /api/admin/auth/logout` - Admin logout

### Super Admin Only Endpoints
- `POST /api/admin/auth/create` - Create new admin user
- `GET /api/admin/auth/all` - Get all admin users

## Authentication Flow

1. Admin enters credentials on login page
2. Frontend sends POST request to `/api/admin/auth/login`
3. Backend verifies credentials and returns JWT token
4. Token is stored in localStorage
5. All subsequent requests include token in `Authorization: Bearer <token>` header
6. Backend middleware verifies token before allowing access
7. On logout, token is cleared from localStorage

## Token Details

- **Expiration**: 7 days
- **Algorithm**: HS256
- **Payload**: `{ id, email, role }`

## Troubleshooting

### Admin user not created
- Ensure `.env` file has `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`
- Run `npm run seed:admin` again
- Check MongoDB connection

### Login fails
- Verify credentials in `.env` file match what you're entering
- Check that the backend is running on the correct port
- Ensure JWT_SECRET is set in `.env`

### Token verification fails
- Token may have expired (7 days)
- JWT_SECRET may have changed
- Clear localStorage and login again

## Security Notes

⚠️ **Important**: 
- Never commit `.env` file to version control
- Use strong, unique JWT_SECRET in production
- Rotate admin passwords regularly
- Use HTTPS in production
- Consider implementing token blacklist for logout in production
