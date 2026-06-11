# 🚀 Image Upload - Quick Start Guide

## 5-Minute Setup

### Step 1: Configure Cloudinary (2 minutes)

1. Go to https://cloudinary.com/
2. Sign up (free tier available)
3. Go to Dashboard → Settings
4. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### Step 2: Update .env File (1 minute)

Edit `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Save file.

### Step 3: Start Server (1 minute)

```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:5000
```

### Step 4: Test Upload (1 minute)

**Test with cURL:**

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Create product with image
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test Product" \
  -F "description=Test Description" \
  -F "category=Test" \
  -F "price=10.99" \
  -F "stock=50" \
  -F "image=@/path/to/image.jpg"
```

**Expected Response:**
```json
{
  "_id": "...",
  "name": "Test Product",
  "image": "https://res.cloudinary.com/.../xyz.jpg",
  "createdAt": "2026-06-11T10:30:00Z"
}
```

✅ **Success!** Image uploaded to Cloudinary!

---

## Complete Workflow Diagram

```
┌─────────────────────────────────────────┐
│ 1. Client selects image from device     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. POST /api/products (multipart)       │
│    ├─ Authorization header (JWT)        │
│    ├─ Form fields (name, price, etc)    │
│    └─ image file (binary)               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. Multer Middleware                    │
│    ├─ Receives request                  │
│    ├─ Validates MIME type (image/*)     │
│    ├─ Checks file size (≤5MB)           │
│    └─ Buffers in memory                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 4. productController                    │
│    ├─ Checks errors                     │
│    ├─ Parses form data                  │
│    ├─ Extracts image buffer             │
│    └─ Calls service                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 5. productService                       │
│    ├─ Validates all fields              │
│    ├─ Calls Cloudinary service          │
│    └─ Handles errors                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 6. Cloudinary (Cloud Storage)           │
│    ├─ Receives buffer stream            │
│    ├─ Stores image on CDN               │
│    ├─ Generates public URL              │
│    └─ Returns: secure_url, public_id    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 7. MongoDB (Database)                   │
│    ├─ Creates product document          │
│    ├─ Stores image field as URL         │
│    │  (NOT binary data)                 │
│    └─ Returns created document          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 8. Response to Client (201 Created)     │
│    ├─ Product ID                        │
│    ├─ All fields                        │
│    ├─ image: "https://res.cloudinary..."│
│    └─ createdAt timestamp               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 9. Frontend displays image              │
│    <img src="https://res.cloudinary...">│
└─────────────────────────────────────────┘
```

---

## Using Postman (GUI Method)

### Setup

1. Open Postman
2. Create new request:
   - Method: POST
   - URL: http://localhost:5000/api/products

### Authorization Tab

1. Select "Bearer Token"
2. Paste token from login response

### Body Tab

1. Select "form-data"
2. Add fields:

| Key | Type | Value |
|-----|------|-------|
| name | text | Test Product |
| description | text | Test Description |
| category | text | Electronics |
| price | text | 19.99 |
| stock | text | 100 |
| image | file | [Select image] |

3. Click "Send"

### Response

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Test Product",
  "image": "https://res.cloudinary.com/.../abc123.jpg",
  ...
}
```

---

## Using JavaScript Fetch

```javascript
async function uploadProduct() {
  // 1. Get token from login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  const { token } = await loginRes.json();

  // 2. Create FormData
  const formData = new FormData();
  formData.append('name', 'Test Product');
  formData.append('description', 'Test Description');
  formData.append('category', 'Electronics');
  formData.append('price', '19.99');
  formData.append('stock', '100');
  
  // 3. Add image file
  const fileInput = document.querySelector('input[type="file"]');
  formData.append('image', fileInput.files[0]);

  // 4. Upload product
  const res = await fetch('http://localhost:5000/api/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const product = await res.json();
  
  // 5. Display image
  const img = document.querySelector('img');
  img.src = product.image;  // Cloudinary URL
  img.alt = product.name;
}
```

---

## React Component Example

```jsx
import { useState } from 'react';

function ProductUpload() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [product, setProduct] = useState(null);

  async function handleUpload(e) {
    e.preventDefault();
    setUploading(true);

    try {
      // 1. Get token
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      const { token } = await loginRes.json();

      // 2. Create FormData
      const formData = new FormData();
      formData.append('name', 'My Product');
      formData.append('description', 'Great product');
      formData.append('category', 'Electronics');
      formData.append('price', '19.99');
      formData.append('stock', '100');
      formData.append('image', image);

      // 3. Upload
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleUpload}>
        <input 
          type="file" 
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
        />
        <button disabled={!image || uploading}>
          {uploading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>

      {product && (
        <div>
          <h3>{product.name}</h3>
          <img 
            src={product.image} 
            alt={product.name}
            style={{ maxWidth: '100%' }}
          />
          <p>Price: ${product.price}</p>
        </div>
      )}
    </div>
  );
}

export default ProductUpload;
```

---

## Troubleshooting

### ❌ Error: "Image upload is not configured"

**Problem:** Cloudinary credentials missing

**Solution:**
```bash
# Check .env has all three:
grep CLOUDINARY .env

# If missing, add them:
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...

# Restart server
npm run dev
```

### ❌ Error: "Only image files are allowed"

**Problem:** Uploading non-image file

**Solution:**
- Use actual image file (jpg, png, webp, gif, etc.)
- Check MIME type: `file image.jpg` should show `image/jpeg`

### ❌ Error: "Image must be 5 MB or smaller"

**Problem:** File too large

**Solution:**
- Compress image before upload
- Use online image compressor
- Reduce dimensions

### ❌ Error: 502 "Image upload failed"

**Problem:** Cloudinary API error

**Solution:**
```bash
# Check credentials are correct
cat .env

# Verify internet connection
ping cloudinary.com

# Check Cloudinary account status
# Go to: https://cloudinary.com/console
```

### ❌ No logs appearing

**Problem:** Not running in dev mode

**Solution:**
```bash
npm run dev  # Not npm start
```

### ✅ Success: "Image uploaded successfully to Cloudinary"

**What to check:**
1. Cloudinary dashboard: Media Library
2. Folder: `product-listing/products/`
3. Your image should be there!

---

## Verification Checklist

- [ ] .env configured with Cloudinary credentials
- [ ] Server running: `npm run dev`
- [ ] Token obtained from login
- [ ] Image file selected (<5MB)
- [ ] POST request sent with multipart/form-data
- [ ] Response contains image URL
- [ ] Image URL works in browser
- [ ] Image appears in Cloudinary dashboard
- [ ] Database contains product with URL

---

## What's Happening at Each Step

### 1. File Selection
- User selects image from device
- File stays in browser (not uploaded yet)

### 2. Multer Processing
- Server receives multipart request
- Multer validates:
  - ✅ File exists
  - ✅ MIME type is image/*
  - ✅ Size ≤ 5MB
- File buffered in memory (not saved to disk)

### 3. Cloudinary Upload
- Buffer sent to Cloudinary via stream
- Cloudinary stores on CDN
- Returns secure URL
- URL stored in database (not buffer)

### 4. Response
- Client receives product with Cloudinary URL
- Frontend displays image using URL

### 5. Image Display
- Browser fetches image from Cloudinary CDN
- Image displays in page

---

## Performance Benefits

✅ **No Disk Usage**
- Images streamed to Cloudinary
- No local uploads folder needed
- Server storage remains small

✅ **CDN Delivery**
- Images served from Cloudinary CDN
- Fast global delivery
- Automatic caching

✅ **Database Efficiency**
- Only URLs stored (small)
- Not binary data (large)
- Faster queries

✅ **Scalability**
- Cloudinary handles storage
- No server limitations
- Unlimited images

---

## Next Steps

1. ✅ Configure Cloudinary
2. ✅ Update .env
3. ✅ Start server
4. ✅ Test upload
5. ✅ Verify in Cloudinary dashboard
6. ✅ Display on frontend
7. ✅ Ready for production!

---

## Image URL Format

After upload, your image URL looks like:
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/product-listing/products/abc123xyz.jpg
```

You can customize this URL with transformations:

```javascript
// Resize to 300x300
https://res.cloudinary.com/.../c_fill,h_300,w_300/.../abc123xyz.jpg

// Add quality adjustment
https://res.cloudinary.com/.../q_80/.../abc123xyz.jpg

// Format as WebP
https://res.cloudinary.com/.../f_webp/.../abc123xyz.jpg

// Multiple transformations
https://res.cloudinary.com/.../c_fill,h_300,w_300,q_80,f_webp/.../abc123xyz.jpg
```

See Cloudinary docs for more: https://cloudinary.com/documentation

---

## Summary

Your image upload system:

✅ **Works end-to-end:**
- Client → Multer → Cloudinary → Database → Response

✅ **Stores in cloud:**
- No local disk space used
- CDN delivery
- Automatic scaling

✅ **Saves URLs only:**
- Database efficient
- Fast queries
- Easy migration

✅ **Production ready:**
- Error handling
- Validation
- Logging
- Security

**You're all set!** 🎉
