# Product Management & Image Upload - Complete Flow Guide

## Architecture Overview

This document explains the complete end-to-end product management flow, including image uploads to Cloudinary.

### Controller Consolidation (Maintained Architecture)

The project now has **only 2 controllers** as requested:

1. **`authController.ts`** - Authentication operations
2. **`productController.ts`** - All product operations including image handling

**Removed:**
- ❌ `uploadController.ts` - Functionality merged into `productController`
- ❌ `uploadRoutes.ts` - General upload endpoint removed (use product endpoints for image upload)

---

## Image Upload Architecture

### Key Principle
**Images are NOT stored in the database. They are uploaded to Cloudinary cloud storage.**

### Data Flow
```
Device File
    ↓
Multer Middleware (Memory Storage)
    ↓
Product Controller
    ↓
Product Service (validation)
    ↓
Cloudinary Service (upload to cloud)
    ↓
Database stores ONLY the Cloudinary URL
```

### Why This Approach?

| Aspect | Benefit |
|--------|---------|
| **Storage** | Cloud-based, scalable, no disk space issues |
| **Delivery** | CDN-backed URLs, fast delivery globally |
| **Bandwidth** | Offloaded from application server |
| **Maintenance** | Cloudinary handles image optimization, transformations |
| **Database** | Stores only URLs (small), not binary data |

---

## Complete Product Lifecycle

### 1. CREATE PRODUCT (POST /api/products)

```
Client
  ↓
POST /api/products
  Headers: Authorization: Bearer <token>
  Body: multipart/form-data
    - name: "Wireless Mouse"
    - description: "Ergonomic 2.4GHz"
    - category: "Electronics"
    - price: 19.99
    - stock: 100
    - image: <binary file data>
  ↓
Express Middleware
  - parseJSON (for JSON payloads)
  - authenticate (validates JWT token)
  - uploadImage (Multer - handles multipart)
  ↓
productController.createProduct()
  - Parses numeric fields (price, stock)
  - Extracts image from request
  - Calls productService.create()
  ↓
productService.create()
  - Validates all required fields
  - Calls resolveProductImage() → uploads to Cloudinary
  - Cloudinary returns secure_url
  - Validates business rules (price >= 0, stock >= 0)
  ↓
productRepository.create()
  - Calls Product.create() (Mongoose)
  - Stores: name, description, category, price, image (URL), stock
  ↓
Database (MongoDB)
  - Document created with Cloudinary URL in image field
  - Timestamps added (createdAt, updatedAt)
  ↓
Response: 201 Created
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz",
  "category": "Electronics",
  "price": 19.99,
  "stock": 100,
  "image": "https://res.cloudinary.com/xxx/image/upload/product-listing/products/abc123.png",
  "createdAt": "2026-06-11T10:30:00Z",
  "updatedAt": "2026-06-11T10:30:00Z"
}
```

#### Testing CREATE with cURL

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Wireless Mouse" \
  -F "description=Ergonomic 2.4GHz mouse with USB receiver" \
  -F "category=Electronics" \
  -F "price=19.99" \
  -F "stock=100" \
  -F "image=@/path/to/your/image.jpg"
```

#### Using Postman

1. Create new POST request to `http://localhost:5000/api/products`
2. Go to **Authorization** tab → Select "Bearer Token" → Paste your JWT
3. Go to **Body** tab → Select "form-data"
4. Add fields:
   - `name` (text): "Wireless Mouse"
   - `description` (text): "Ergonomic 2.4GHz mouse"
   - `category` (text): "Electronics"
   - `price` (text): "19.99"
   - `stock` (text): "100"
   - `image` (file): Select your image file from device
5. Click "Send"

#### Accepted Image Field Names
The backend accepts images via any of these field names:
- `image` ← **Recommended**
- `file`
- `picture`

---

### 2. READ PRODUCT (GET /api/products/:id)

```
Client
  ↓
GET /api/products/507f1f77bcf86cd799439011
  ↓
productController.getProduct()
  - Validates ID format
  ↓
productService.findById()
  - Queries database by ID
  - Throws 404 if not found
  ↓
productRepository.findById()
  - Queries MongoDB
  ↓
Response: 200 OK
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Wireless Mouse",
  "image": "https://res.cloudinary.com/xxx/image/upload/...",
  ...
}
```

#### Testing READ

```bash
curl http://localhost:5000/api/products/507f1f77bcf86cd799439011
```

---

### 3. LIST PRODUCTS (GET /api/products?limit=10&skip=0)

```
Client
  ↓
GET /api/products?limit=10&skip=0
  ↓
productController.getProducts()
  - Parses pagination parameters
  - Validates: limit (1-100, default 10), skip (default 0)
  ↓
productService.findAll(pagination)
  ↓
productRepository.findAll(pagination)
  - Queries MongoDB with limit and skip
  - Counts total documents
  ↓
Response: 200 OK
{
  "data": [
    { "_id": "...", "name": "Mouse", "image": "https://...", ... },
    { "_id": "...", "name": "Keyboard", "image": "https://...", ... }
  ],
  "total": 150,        // Total products in database
  "limit": 10,         // Items per page
  "skip": 0,           // Items skipped
  "hasMore": true      // Whether more items exist
}
```

#### Pagination Examples

```bash
# First page (10 items)
curl http://localhost:5000/api/products?limit=10&skip=0

# Second page (10 items)
curl http://localhost:5000/api/products?limit=10&skip=10

# Get 50 items
curl http://localhost:5000/api/products?limit=50&skip=0

# Default pagination (limit=10, skip=0)
curl http://localhost:5000/api/products
```

#### Frontend Pagination Example (JavaScript)

```javascript
async function fetchProducts(page = 1, itemsPerPage = 10) {
  const skip = (page - 1) * itemsPerPage;
  const response = await fetch(
    `http://localhost:5000/api/products?limit=${itemsPerPage}&skip=${skip}`
  );
  const { data, total, hasMore } = await response.json();
  
  console.log(`Page ${page} of ${Math.ceil(total / itemsPerPage)}`);
  console.log(`Showing ${data.length} items`);
  console.log(`More items available: ${hasMore}`);
  
  return { data, total, hasMore };
}
```

---

### 4. UPDATE PRODUCT (PUT /api/products/:id)

```
Client
  ↓
PUT /api/products/507f1f77bcf86cd799439011
  Headers: Authorization: Bearer <token>
  Body: multipart/form-data
    - name: "Wireless Mouse Pro" (optional)
    - price: 24.99 (optional)
    - image: <new image file> (optional)
  ↓
productController.updateProduct()
  - Extracts optional image from request
  ↓
productService.update()
  - Validates provided fields
  - If new image: uploads to Cloudinary
  - Updates database fields
  ↓
productRepository.update()
  - Mongoose updates document with {new: true}
  ↓
Response: 200 OK
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Wireless Mouse Pro",
  "price": 24.99,
  "image": "https://res.cloudinary.com/xxx/image/upload/...",  // New URL
  "updatedAt": "2026-06-11T11:45:00Z"
}
```

#### Testing UPDATE with cURL

```bash
# Update just the name
curl -X PUT http://localhost:5000/api/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Wireless Mouse Pro"

# Update with new image
curl -X PUT http://localhost:5000/api/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "price=24.99" \
  -F "image=@/path/to/new/image.jpg"
```

#### Using Postman

1. Create new PUT request to `http://localhost:5000/api/products/{product_id}`
2. Add Bearer token in Authorization tab
3. Go to Body → form-data
4. Add only the fields you want to update
5. Send

---

### 5. DELETE PRODUCT (DELETE /api/products/:id)

```
Client
  ↓
DELETE /api/products/507f1f77bcf86cd799439011
  Headers: Authorization: Bearer <token>
  ↓
productController.deleteProduct()
  ↓
productService.delete()
  - Checks product exists, throws 404 if not
  ↓
productRepository.delete()
  - Removes document from database
  ↓
Response: 204 No Content
```

**Note:** The image file in Cloudinary is NOT automatically deleted. To implement cleanup, add a scheduled job or handle it manually in Cloudinary dashboard.

#### Testing DELETE

```bash
curl -X DELETE http://localhost:5000/api/products/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Image Upload Troubleshooting Guide

### Issue: Image not uploading, getting 400 error

**Cause:** Image field name mismatch or no file provided

**Solution:**
- Ensure you're using one of: `image`, `file`, or `picture`
- Verify file is attached to form-data
- Check file size is under 5MB

**Debug:**
```bash
# Enable debug logging - check server output for file details
npm run dev

# Look for: "File upload received" log entry
```

---

### Issue: Image uploading but getting 503 error

**Cause:** Cloudinary credentials not configured

**Solution:**
1. Check `.env` file has all three Cloudinary variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. Restart the server: `npm run dev`

3. Verify in logs:
   ```
   ✓ Server running on http://localhost:5000
   (no warning about Cloudinary)
   ```

---

### Issue: Image uploading but getting 502 error

**Cause:** Cloudinary API error (credentials invalid, network issue, etc.)

**Solution:**
1. Verify Cloudinary credentials are correct
2. Check internet connection
3. Verify API key has "General" preset enabled in Cloudinary
4. Check server logs for detailed error:
   ```
   Cloudinary upload failed
   ```

---

### Issue: Image uploads but database stores empty/wrong URL

**Cause:** Response parsing error

**Solution:**
1. Check application logs during upload
2. Verify Cloudinary account and folder structure
3. Test Cloudinary API directly:
   ```bash
   curl -X POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload \
     -F "file=@/path/to/image.jpg" \
     -F "api_key={api_key}"
   ```

---

## Cloudinary Image Flow Details

### How Images Are Stored

1. **Upload**: Client sends binary file → Multer buffers in memory
2. **Processing**: Product Service validates, sends to Cloudinary
3. **Storage**: Cloudinary stores on CDN and returns URL
4. **Database**: Only the URL stored (example):
   ```
   https://res.cloudinary.com/demo/image/upload/v1234567890/product-listing/products/abc123xyz.jpg
   ```

### Cloudinary URL Structure

```
https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{folder}/{public_id}.{ext}
```

- `{cloud_name}`: Your Cloudinary account identifier
- `{transformations}`: Optional image modifications (resize, crop, etc.)
- `{folder}`: `product-listing/products/` (organized by type)
- `{public_id}`: Unique identifier assigned by Cloudinary
- `{ext}`: File extension (jpg, png, webp, etc.)

### Allowed Folder Types

```typescript
// Defined in cloudinaryService.ts
ALLOWED_FOLDERS = ["products", "landing", "general"]
```

- `products` ← Used for product images (default for product creation)
- `landing` ← For landing page images
- `general` ← Fallback for unspecified images

---

## Database Schema

### Product Model

```javascript
{
  _id: ObjectId,
  name: String,              // Required
  description: String,       // Required
  category: String,          // Required
  price: Number,            // Required, min: 0
  stock: Number,            // Required, min: 0
  image: String,            // Required - CLOUDINARY URL (not binary)
  createdAt: Date,          // Auto-generated
  updatedAt: Date           // Auto-generated
}
```

**Key Point:** The `image` field stores a **URL string**, NOT the binary image data.

---

## Error Responses Reference

### 400 Bad Request
```json
{
  "message": "Only image files are allowed (received: text/plain)"
}
```
- Invalid image type (not image/*)
- Missing required fields
- Invalid numeric values

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```
- Missing Bearer token
- Invalid JWT token
- Expired token

### 404 Not Found
```json
{
  "message": "Product not found"
}
```
- Product ID doesn't exist

### 502 Bad Gateway
```json
{
  "message": "Image upload failed: Unauthorized"
}
```
- Cloudinary API error
- Invalid credentials
- Network connectivity issue

### 503 Service Unavailable
```json
{
  "message": "Image upload is not configured"
}
```
- Cloudinary credentials missing from `.env`

---

## Testing Checklist

- [ ] Cloudinary credentials configured in `.env`
- [ ] Login endpoint working (get JWT token)
- [ ] POST product with image file ✓
- [ ] Image stored on Cloudinary (check dashboard)
- [ ] Database has URL, not binary data
- [ ] GET product returns correct image URL
- [ ] PUT product with new image ✓
- [ ] Old image still on Cloudinary (expected)
- [ ] DELETE product removes database entry
- [ ] Image remains on Cloudinary (expected)
- [ ] GET list with pagination ✓
- [ ] Pagination hasMore flag works correctly

---

## Performance Optimization Notes

### Image Delivery
- Cloudinary serves images via global CDN
- No additional latency from application
- Browser caches images using HTTP headers

### Database Query
- Products are paginated (no full table scan)
- Index on `createdAt` for sorting performance

### Memory Usage
- Images buffered in memory during upload
- 5MB max file size prevents memory overflow
- Image deleted from memory after Cloudinary upload

---

## Architecture Compliance

✅ **Maintained Patterns:**
- Repository pattern (data access isolated)
- Service layer (business logic separate)
- Controller layer (thin request handling)
- Middleware for cross-cutting concerns
- Error handler centralized
- Only 2 controllers (Auth + Product)

✅ **Image Upload Flow:**
- No database image storage
- Cloud-first architecture (Cloudinary)
- Proper error handling with meaningful messages
- Logging at each step for debugging
- Scalable and maintainable
