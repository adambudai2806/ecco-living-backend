here # 🗄️ PostgreSQL Database Setup for Ecco Living

## Quick Setup with Neon (Free - Handles 10,000+ products)

### Step 1: Create Free Neon Account
1. Go to **https://neon.tech**
2. Click **"Sign up"** 
3. Sign up with GitHub/Google (fastest)
4. Create your first project:
   - **Project name**: `ecco-living`
   - **Database name**: `ecco_living_db`
   - **Region**: Choose closest to Australia (Asia Pacific)

### Step 2: Get Connection String
After creating the project, Neon will show you a connection string like:
```
postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/ecco_living_db?sslmode=require
```

### Step 3: Update Environment Variables
Add this to your `.env` file:
```
DATABASE_URL="postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/ecco_living_db?sslmode=require"
NODE_ENV="development"
```

### Step 4: Run Database Migrations
```bash
npm run db:migrate
```

### Step 5: (Optional) Seed with Sample Data
```bash
npm run db:seed
```

## ✅ Benefits of Real Database vs Mock:
- **✅ Persistent products** - Your scraped products won't disappear on server restart
- **✅ See saved products** in admin products list immediately
- **✅ Product editing/updating** works properly
- **✅ Category filtering** works correctly
- **✅ Search functionality** works across all products
- **✅ Handles 2500+ products** easily
- **✅ Real product URLs** like `/product/el-12345678`
- **✅ Production ready** when you're ready to deploy

## Alternative Options:
- **Supabase**: https://supabase.com (500MB free)
- **Railway**: https://railway.app (1GB free)
- **PlanetScale**: https://planetscale.com (5GB free)