# Quick Start: Testing Image Upload

## Prerequisites

1. **MongoDB running** and connection string in `.env`
2. **Cloudinary account** with credentials in `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=xxx
   CLOUDINARY_API_KEY=xxx
   CLOUDINARY_API_SECRET=xxx
   ```
3. **Server running**: `npm run dev`
4. **Test image file** ready (any .jpg, .png, .webp, etc.)

---

## Step-by-Step Testing

### Step 1: Login & Get Token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "admin"
  }
}
```

**Save the token** for next requests.

---

### Step 2: Create Product with Image Upload

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "name=Wireless Mouse" \
  -F "description=Ergonomic 2.4GHz mouse with 1600 DPI" \
  -F "category=Electronics" \
  -F "price=19.99" \
  -F "stock=100" \
  -F "image=@/path/to/your/image.jpg"
```

**Replace:**
- `eyJhbGc...` with your actual token
- `/path/to/your/image.jpg` with path to an actual image file

**Expected Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz mouse with 1600 DPI",
  "category": "Electronics",
  "price": 19.99,
  "stock": 100,
  "image": "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/product-listing/products/abc123xyz.jpg",
  "createdAt": "2026-06-11T10:30:00.000Z",
  "updatedAt": "2026-06-11T10:30:00.000Z"
}
```

✅ **Success Indicators:**
- Status: 201 Created
- `image` field contains a Cloudinary URL (not empty)
- URL structure: `https://res.cloudinary.com/...`

❌ **Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| 503 "Image upload is not configured" | Cloudinary credentials missing | Check `.env` file |
| 502 "Image upload failed" | Invalid Cloudinary credentials | Verify API key/secret |
| 400 "Only image files are allowed" | Wrong file type | Use actual image file |
| 400 "Image must be 5 MB or smaller" | File too large | Use smaller image |

---

### Step 3: Verify Image on Cloudinary

1. Go to your Cloudinary dashboard
2. Navigate to **Media Library**
3. Look for folder: `product-listing/products/`
4. You should see the uploaded image

---

### Step 4: Retrieve Product

```bash
curl http://localhost:5000/api/products/507f1f77bcf86cd799439012
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Wireless Mouse",
  "image": "https://res.cloudinary.com/...",
  ...
}
```

✅ Image URL should be the same as created

---

### Step 5: List Products with Pagination

```bash
# Get first 10 products
curl http://localhost:5000/api/products?limit=10&skip=0

# Get next 10 products
curl http://localhost:5000/api/products?limit=10&skip=10

# Get 50 products
curl http://localhost:5000/api/products?limit=50&skip=0
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Wireless Mouse",
      "image": "https://res.cloudinary.com/...",
      ...
    }
  ],
  "total": 1,
  "limit": 10,
  "skip": 0,
  "hasMore": false
}
```

✅ Check `data` array, `total` count, and `hasMore` flag

---

### Step 6: Update Product with New Image

```bash
curl -X PUT http://localhost:5000/api/products/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer eyJhbGc..." \
  -F "price=24.99" \
  -F "image=@/path/to/new/image.jpg"
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Wireless Mouse",
  "price": 24.99,
  "image": "https://res.cloudinary.com/.../new_image_id.jpg",
  "updatedAt": "2026-06-11T11:45:00.000Z"
}
```

✅ Image URL should be different (new upload)
✅ Price updated
✅ Old image remains on Cloudinary

---

### Step 7: Delete Product

```bash
curl -X DELETE http://localhost:5000/api/products/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response (204 No Content):**
- No response body (expected)
- Status: 204 means success

---

## Using Postman (GUI Alternative)

### Import Collection

1. Create new Postman Collection: "Product Listing API"
2. Create folders:
   - Auth
   - Products

### Auth: Login

**POST** `http://localhost:5000/api/auth/login`

Body (JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Save the response token.

---

### Products: Create with Image

**POST** `http://localhost:5000/api/products`

**Authorization Tab:** Bearer Token (paste token from login)

**Body Tab:** Select "form-data"

| Key | Type | Value |
|-----|------|-------|
| name | text | Wireless Mouse |
| description | text | Ergonomic 2.4GHz |
| category | text | Electronics |
| price | text | 19.99 |
| stock | text | 100 |
| image | file | [Select image from device] |

Click "Send" → Should return 201 with image URL

---

### Products: List with Pagination

**GET** `http://localhost:5000/api/products?limit=10&skip=0`

Click "Send" → Should return paginated results

---

### Products: Get Single

**GET** `http://localhost:5000/api/products/{product_id}`

Replace `{product_id}` with actual ID from create response

---

### Products: Update

**PUT** `http://localhost:5000/api/products/{product_id}`

**Authorization Tab:** Bearer Token

**Body Tab:** form-data (optional fields only)

```
price: 24.99
image: [Select new image file]
```

---

### Products: Delete

**DELETE** `http://localhost:5000/api/products/{product_id}`

**Authorization Tab:** Bearer Token

---

## Debugging with Server Logs

When running `npm run dev`, you'll see logs:

### Successful Image Upload
```
[10:30:15] File upload received {
  fieldname: "image",
  mimetype: "image/jpeg",
  size: 256341
}
[10:30:15] Image validated
[10:30:15] Creating product {
  productName: "Wireless Mouse",
  hasImage: true
}
[10:30:16] Uploading image to Cloudinary...
[10:30:17] Image uploaded successfully to Cloudinary {
  url: "https://res.cloudinary.com/demo/image/upload/v123/product-listing/products/abc.jpg",
  publicId: "product-listing/products/abc123"
}
```

### Failed Image Upload
```
[10:30:15] File upload received {
  fieldname: "image",
  mimetype: "text/plain",
  size: 1024
}
[10:30:15] Invalid file type rejected {
  mimetype: "text/plain"
}
[10:30:15] Multer error
```

---

## Expected Behavior Summary

| Operation | Status | Image Stored | Database |
|-----------|--------|--------------|----------|
| Create with image | 201 | Cloudinary ✓ | URL stored ✓ |
| Create without image | 400 | - | Error (required) |
| Update with new image | 200 | Cloudinary ✓ | URL updated ✓ |
| Update without image | 200 | - | Unchanged ✓ |
| Delete | 204 | Remains ✓ | Removed ✓ |
| List (paginated) | 200 | - | URLs returned ✓ |

---

## Common Questions

### Q: Where are images stored?
**A:** On Cloudinary cloud storage. Database only stores the URL.

### Q: Why is image field required for create?
**A:** Products must have an image. You can either upload a file or provide a URL.

### Q: Can I update only the price without a new image?
**A:** Yes. Just omit the image field in the PUT request.

### Q: What happens to old images when I update?
**A:** They remain on Cloudinary. You need to delete them manually in Cloudinary dashboard if needed.

### Q: Can I access the image URL directly?
**A:** Yes. Copy the URL from the response and paste in browser or use in `<img>` tag.

### Q: What image formats are supported?
**A:** Any image format (jpg, png, webp, gif, etc.). Cloudinary automatically handles format conversion.

### Q: Is there a file size limit?
**A:** Yes. 5 MB maximum per image.

---

## Architecture Compliance Checklist

✅ Only 2 Controllers:
- authController (login, me)
- productController (CRUD + image upload)

✅ Image Upload Flow:
- Client sends multipart/form-data
- Multer buffers in memory
- Service validates and uploads to Cloudinary
- Database stores only URL
- Response includes Cloudinary URL

✅ Pagination:
- GET /api/products?limit=10&skip=0
- Returns: data, total, limit, skip, hasMore

✅ Error Handling:
- Centralized middleware
- Meaningful error messages
- Proper HTTP status codes

✅ Logging:
- File upload tracking
- Cloudinary upload logs
- Error details for debugging
