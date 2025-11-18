# Unyt - Student Platform

Simple platform for University of Hertfordshire students.

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm run dev
```
✅ Backend: http://localhost:5000

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend: http://localhost:5173

### 3. Open Browser
Go to: http://localhost:5173

---

## ✅ What I Fixed

### Issue 1: "Entity Too Large" ❌ → ✅ FIXED
**Problem**: Couldn't upload images
**Solution**: 
- Increased backend payload limit to 50mb
- Fixed FormData handling in API service
- Backend now properly parses image uploads

### Issue 2: "429 Too Many Requests" ❌ → ✅ FIXED
**Problem**: Rate limiting was too strict
**Solution**:
- Disabled rate limiting in development mode
- Increased limits to 1000 requests/minute
- Auto-bypass if Redis is not running

---

## 🎯 All Features Working

### ✅ Authentication
- Register with @herts.ac.uk email
- Login and get tokens
- Auto token refresh
- Logout clears session

### ✅ Listings
- View all listings (grid layout)
- Filter by type (All/Housing/Marketplace/Buddy)
- Create listings with:
  - Title & Description
  - Price (Housing/Marketplace)
  - Location (Housing/Buddy)
  - Multiple images (up to 5)

### ✅ Search
- Text search across all listings
- Shows results count
- Empty state handling

### ✅ UI/UX
- Bootstrap styling (no complex CSS)
- Responsive design
- Loading states
- Error notifications
- Success messages

---

## 📋 User Flow

```
1. Register → Enter details → Auto-login
2. View Listings → Filter by type
3. Create Listing → Fill form → Upload images → Submit
4. Search → Enter keywords → View results
5. Logout → Clear session
```

---

## 🔧 Configuration

### Backend (.env already exists)
- MongoDB: `mongodb://localhost:27017/unyt`
- Redis: `localhost:6379` (optional - bypassed in dev)
- CORS: Allows `http://localhost:5173`
- Rate limiting: Disabled in development

### Frontend (no .env needed)
- API URL: `http://localhost:5000/api` (default)

---

## ⚠️ Requirements

### Must Have:
- ✅ Node.js
- ✅ MongoDB running

### Optional:
- Redis (rate limiting disabled in dev mode)
- Cloudinary (for image hosting in production)

---

## 🎨 Simple Code

### No Complex Stuff:
- ❌ No Redux
- ❌ No Context API
- ❌ No TypeScript
- ❌ No custom CSS

### Just Simple:
- ✅ React hooks (useState, useEffect)
- ✅ Bootstrap classes
- ✅ Simple routing
- ✅ Clear code structure

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Start MongoDB
mongod
# or
sudo systemctl start mongodb
```

### "429 Too Many Requests"
✅ Already fixed! Rate limiting disabled in development.

### "Entity Too Large"
✅ Already fixed! Backend accepts 50mb payloads.

### Images not uploading
- Check file size (max 5MB per image)
- Cloudinary not configured yet (will use mock in dev)

### Can't login/register
- Check MongoDB is running
- Clear browser localStorage
- Check backend console for errors

---

## 📁 Project Structure

```
Unyt/
├── backend/
│   ├── server.js              # Main server (CORS, payload limits)
│   └── src/
│       ├── controllers/       # Listing & auth logic
│       ├── middleware/        # Rate limiter (disabled in dev)
│       ├── models/            # MongoDB schemas
│       └── routes/            # API endpoints
│
└── frontend/
    └── src/
        ├── pages/             # Login, Register, Listings, Create, Search
        ├── components/        # Navbar, ListingCard, Notification
        ├── services/
        │   └── api.js         # API service (fixed FormData)
        └── App.jsx            # Main routing
```

---

## ✨ What Works Now

1. ✅ **Register** - Create account with university email
2. ✅ **Login** - Secure authentication
3. ✅ **View Listings** - See all listings with images
4. ✅ **Filter** - By Housing/Marketplace/Buddy
5. ✅ **Create Listing** - With images (no more "entity too large")
6. ✅ **Search** - Find specific listings
7. ✅ **No Rate Limiting** - In development mode
8. ✅ **Logout** - Clear session

---

## 🎉 You're Ready!

1. Make sure MongoDB is running
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Open: http://localhost:5173
5. Register and start creating listings!

**Everything is simple, clean, and working!** 🚀

---

## 💡 Tips

- Use @herts.ac.uk email for registration
- Add images to make listings attractive
- Use clear titles and descriptions
- Filter listings to find what you need
- Search with specific keywords

---

**Made simple with React + Bootstrap + Express + MongoDB**

