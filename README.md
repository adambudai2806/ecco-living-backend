# Ecco Living - Premium Home Solutions E-commerce Platform

A sophisticated e-commerce platform for luxury home renovation materials and fittings, featuring a modern React-inspired frontend and a comprehensive Node.js backend with admin dashboard.

## 🌟 Features

### Frontend
- **Modern Design**: Luxury-focused UI with smooth animations powered by GSAP
- **Responsive**: Mobile-first design that works on all devices  
- **Performance**: Optimized loading with lazy loading and caching
- **Accessibility**: WCAG 2.1 compliant with proper ARIA labels
- **SEO Optimized**: Structured data and meta tags for better search visibility

### Backend
- **RESTful API**: Comprehensive API for all e-commerce operations
- **Authentication**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with Knex.js migrations and models
- **Caching**: Redis integration for improved performance
- **Security**: Rate limiting, input validation, and security headers
- **Monitoring**: Comprehensive logging and error tracking

### Admin Dashboard
- **Product Management**: Full CRUD operations for products and categories
- **Order Management**: Track and manage customer orders
- **Customer Management**: View and manage customer accounts
- **Analytics**: Dashboard with sales charts and statistics
- **Newsletter**: Manage email subscriptions and campaigns

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/eccoliving/website.git
   cd ecco-living
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - Database credentials
   - JWT secrets
   - Email service settings
   - Payment gateway keys

4. **Set up the database**
   ```bash
   # Create database
   createdb ecco_living
   
   # Run migrations
   npm run db:migrate
   
   # Seed sample data
   npm run db:seed
   ```

5. **Create admin user**
   ```bash
   npm run admin:create
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to view the application.

## 📁 Project Structure

```
ecco-living/
├── README.md
├── package.json
├── .env.example
├── index.html                 # Main application
├── assets/                    # Frontend assets
│   ├── css/
│   ├── js/
│   └── images/
├── admin/                     # Admin dashboard
│   ├── index.html
│   └── js/
├── server/                    # Backend application
│   ├── index.js              # Server entry point
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   ├── utils/                # Utility functions
│   ├── database/             # DB migrations & seeds
│   └── tests/                # Test files
├── uploads/                   # File uploads
└── logs/                     # Application logs
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Start development server with hot reload
npm start                     # Start production server

# Database
npm run db:migrate            # Run database migrations
npm run db:rollback           # Rollback last migration
npm run db:seed               # Seed database with sample data

# Testing
npm test                      # Run test suite
npm run test:watch           # Run tests in watch mode

# Utilities
npm run admin:create         # Create admin user
npm run backup:db            # Backup database
npm run lint                 # Run ESLint
npm run lint:fix             # Fix ESLint errors

# Production
npm run build                # Build for production
npm run deploy               # Deploy application
```

### API Endpoints

#### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `POST /api/users/logout` - User logout
- `POST /api/users/forgot-password` - Forgot password

#### Products
- `GET /api/products` - List products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

#### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category details
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

#### Orders
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (admin)

#### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter
- `DELETE /api/newsletter/unsubscribe` - Unsubscribe from newsletter

### Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: Customer and admin accounts
- **categories**: Product categories (hierarchical)
- **products**: Product catalog with variants and attributes
- **product_categories**: Many-to-many relationship
- **orders**: Customer orders
- **order_items**: Individual items within orders
- **newsletter_subscriptions**: Email subscribers
- **product_reviews**: Customer product reviews
- **coupons**: Discount codes and promotions
- **audit_logs**: System activity tracking

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=ecco_user
DB_PASSWORD=ecco_password
DB_NAME=ecco_living

# JWT Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Redis Configuration (Optional)

Redis is used for caching and session storage. Configure in `.env`:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
```

## 🚀 Deployment

### Production Setup

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   PORT=3000
   # Update all production URLs and credentials
   ```

2. **Database Setup**
   ```bash
   npm run db:migrate
   npm run admin:create
   ```

3. **Build and Start**
   ```bash
   npm run build
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Process Management

Use PM2 for production process management:

```bash
npm install -g pm2
pm2 start server/index.js --name ecco-living
pm2 save
pm2 startup
```

## 📊 Monitoring

### Logging

The application uses Winston for structured logging:

- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Access logs**: HTTP requests via Morgan

### Health Checks

- **Health endpoint**: `GET /health`
- **Database status**: Included in health response
- **Redis status**: Included if configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: [docs.eccoliving.com.au](https://docs.eccoliving.com.au)
- **Issues**: [GitHub Issues](https://github.com/eccoliving/website/issues)
- **Email**: [support@eccoliving.com.au](mailto:support@eccoliving.com.au)

## 🙏 Acknowledgments

- Built with Node.js and Express
- Frontend animations powered by GSAP
- Database management with Knex.js
- UI components inspired by Tailwind CSS
- Charts and analytics with Chart.js

---

**Ecco Living** - Curating exceptional home solutions with uncompromising quality and timeless design.