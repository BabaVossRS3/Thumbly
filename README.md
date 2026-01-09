# Thumby

A full-stack web application with a Node.js/Express backend and React frontends for both user-facing and admin interfaces.

## Project Structure

```
Thumby/
├── backend/          # Express.js API server
├── frontend/         # React user-facing application
├── admin/            # React admin dashboard
└── package.json      # Root package configuration
```

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Payment**: Stripe integration
- **File Storage**: Cloudinary
- **AI**: Google GenAI
- **Session Management**: express-session with MongoDB store
- **CORS**: Enabled for cross-origin requests

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **HTTP Client**: Axios

### Admin Dashboard
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance (local or cloud)
- Stripe account (for payment processing)
- Google Cloud credentials (for GenAI)
- Cloudinary account (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Thumby
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run server
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Admin Dashboard Setup**
   ```bash
   cd admin
   npm install
   npm run dev
   ```

## Environment Variables

### Backend (.env)
Create a `.env` file in the `backend/` directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SESSION_SECRET=your_session_secret
```

Refer to `.env.example` for additional configuration options.

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

### Admin (.env)
```
VITE_API_URL=http://localhost:5000
```

## Available Scripts

### Backend
- `npm run start` - Start the production server
- `npm run server` - Start the development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run seed:admin` - Seed admin user to database
- `npm run setup:stripe` - Setup Stripe products

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Admin
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Setup Guides

For detailed setup instructions, refer to:
- [Stripe Setup Guide](./backend/STRIPE_SETUP.md)
- [Admin Setup Guide](./backend/ADMIN_SETUP.md)

## Deployment

The project is configured for deployment on Vercel:
- Backend: `backend/vercel.json`
- Frontend: `frontend/vercel.json`

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
