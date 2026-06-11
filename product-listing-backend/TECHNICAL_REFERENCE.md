# Technical Reference: Implementation Details

## Pagination Implementation

### Repository Layer

**File:** `src/repositories/productRepository.ts`

```typescript
export interface PaginationOptions {
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

export const productRepository = {
  async findAll(options?: PaginationOptions): Promise<PaginatedResult<IProduct>> {
    const limit = options?.limit ?? 10;
    const skip = options?.skip ?? 0;

    const [data, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec(),
      Product.countDocuments().exec(),
    ]);

    return {
      data,
      total,
      limit,
      skip,
      hasMore: skip + data.length < total,
    };
  },
};
```

### Service Layer

**File:** `src/services/productService.ts`

```typescript
async findAll(pagination?: PaginationOptions): Promise<PaginatedResult<IProduct>> {
  try {
    return await productRepository.findAll(pagination);
  } catch (error) {
    handleServiceError(error);
  }
}
```

### Controller Layer

**File:** `src/controllers/productController.ts`

```typescript
function parsePaginationParams(query: any) {
  const limit = Math.max(1, Math.min(Number(query.limit) || 10, 100));
  const skip = Math.max(0, Number(query.skip) || 0);
  return { limit, skip };
}

export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePaginationParams(req.query);
    logger.info({ limit: pagination.limit, skip: pagination.skip }, "Fetching products");

    const result = await productService.findAll(pagination);
    res.status(200).json(result);
  } catch (error) {
    logger.error({ err: error }, "Error fetching products");
    next(error);
  }
}
```

### Swagger Documentation

**File:** `src/routes/productRoutes.ts`

```typescript
/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: List all products with pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 skip:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 */
```

---

## Image Upload Implementation

### Multer Configuration

**File:** `src/middleware/upload.ts`

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_FIELDS = ["image", "file", "picture"] as const;

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    logger.info(
      { fieldname: file.fieldname, mimetype: file.mimetype, size: file.size },
      "File upload received"
    );

    if (file.mimetype.startsWith("image/")) {
      logger.info({ filename: file.originalname }, "Image validated");
      cb(null, true);
    } else {
      const error = new AppError(400, `Only image files are allowed (received: ${file.mimetype})`);
      logger.warn({ mimetype: file.mimetype }, "Invalid file type rejected");
      cb(error);
    }
  },
}).fields(IMAGE_FIELDS.map((name) => ({ name, maxCount: 1 })));

export function getUploadedImage(req: Request): Express.Multer.File | undefined {
  const files = (req as any).files;
  logger.debug({ hasFiles: !!files, fields: Object.keys(files || {}) }, "Checking uploaded files");

  if (!files) {
    logger.debug("No files object found in request");
    return undefined;
  }

  for (const field of IMAGE_FIELDS) {
    const fileArray = files[field];
    if (fileArray && Array.isArray(fileArray) && fileArray.length > 0) {
      const file = fileArray[0];
      logger.info(
        { field, filename: file.originalname, size: file.size, mimetype: file.mimetype },
        "Image file extracted"
      );
      return file;
    }
  }

  logger.warn("No valid image field found in uploaded files");
  return undefined;
}
```

### Cloudinary Service

**File:** `src/services/cloudinaryService.ts`

```typescript
export function uploadBuffer(
  buffer: Buffer,
  folderInput?: unknown
): Promise<UploadApiResponse> {
  if (!isCloudinaryConfigured) {
    logger.error("Cloudinary not configured");
    return Promise.reject(new AppError(503, "Image upload is not configured"));
  }

  if (!buffer || buffer.length === 0) {
    logger.error("Empty buffer provided for upload");
    return Promise.reject(new AppError(400, "Image buffer is empty"));
  }

  const folder = resolveFolder(folderInput);
  logger.info({ folder, bufferSize: buffer.length }, "Starting Cloudinary upload");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        timeout: 60000,
      },
      (error, result) => {
        if (error) {
          logger.error(
            {
              err: error,
              folder,
              errorCode: (error as any)?.http_code,
            },
            "Cloudinary upload failed"
          );
          reject(new AppError(502, `Image upload failed: ${error.message}`));
        } else if (!result) {
          logger.error({ folder }, "Cloudinary upload returned no result");
          reject(new AppError(502, "Cloudinary upload returned empty result"));
        } else {
          logger.info(
            {
              publicId: result.public_id,
              url: result.secure_url,
              size: result.bytes,
            },
            "Image uploaded successfully to Cloudinary"
          );
          resolve(result);
        }
      }
    );

    stream.on("error", (error: any) => {
      logger.error({ err: error }, "Stream error during Cloudinary upload");
      reject(new AppError(502, "Image upload stream error"));
    });

    stream.end(buffer);
  });
}
```

### Product Service Image Handling

**File:** `src/services/productService.ts`

```typescript
async function resolveProductImage(
  imageUrl: string | undefined,
  imageUpload?: ProductImageUpload
): Promise<string | undefined> {
  if (!imageUpload) {
    return imageUrl;
  }

  try {
    logger.info("Uploading image to Cloudinary...");
    const result = await uploadBuffer(imageUpload.buffer, "products");
    logger.info(
      { url: result.secure_url, publicId: result.public_id },
      "Image uploaded successfully"
    );
    return result.secure_url;
  } catch (error) {
    logger.error({ err: error }, "Cloudinary upload failed");
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(502, "Failed to upload image to cloud storage");
  }
}

async create(
  input: CreateProductInput,
  imageUpload?: ProductImageUpload
): Promise<IProduct> {
  try {
    const { name, description, category, price, stock } = input ?? {};
    const image = await resolveProductImage(input?.image, imageUpload);

    if (
      !name ||
      !description ||
      !category ||
      price === undefined ||
      price === null ||
      !image ||
      stock === undefined ||
      stock === null
    ) {
      throw new AppError(
        400,
        "name, description, category, price, image and stock are required"
      );
    }

    // Validation logic...

    return await productRepository.create({
      name,
      description,
      category,
      price,
      image,
      stock,
    });
  } catch (error) {
    handleServiceError(error);
  }
}
```

### Controller Image Handling

**File:** `src/controllers/productController.ts`

```typescript
export function createProduct(req: Request, res: Response, next: NextFunction): void {
  uploadImage(req, res, async (err: unknown) => {
    const appErr = multerErrorToAppError(err);
    if (appErr) {
      logger.warn({ err: appErr }, "Multer error");
      next(appErr);
      return;
    }

    try {
      const productData = parseProductData(req.body);
      const image = getUploadedImage(req);

      logger.info({ productName: productData.name, hasImage: !!image }, "Creating product");

      const product = await productService.create(
        productData,
        image ? { buffer: image.buffer } : undefined
      );
      res.status(201).json(product);
    } catch (error) {
      logger.error({ err: error }, "Error creating product");
      next(error);
    }
  });
}
```

---

## Controller Architecture

### Before (3 Controllers)

```
src/controllers/
├── authController.ts
│   ├── login()
│   └── me()
├── productController.ts
│   ├── createProduct()
│   ├── getProducts()
│   ├── getProduct()
│   ├── updateProduct()
│   └── deleteProduct()
└── uploadController.ts        ← REMOVED
    └── uploadProductImage()
```

### After (2 Controllers)

```
src/controllers/
├── authController.ts
│   ├── login()
│   └── me()
└── productController.ts       ← Consolidated
    ├── createProduct()        [includes image upload]
    ├── getProducts()          [with pagination]
    ├── getProduct()
    ├── updateProduct()        [includes image upload]
    └── deleteProduct()
```

---

## Error Handling Flow

### Image Upload Error Handling

```typescript
function multerErrorToAppError(err: unknown): AppError | null {
  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller"
        : err.message;
    return new AppError(400, message);
  }
  if (err) {
    return err instanceof AppError ? err : new AppError(400, "Upload failed");
  }
  return null;
}

// In controller
uploadImage(req, res, async (err: unknown) => {
  const appErr = multerErrorToAppError(err);
  if (appErr) {
    logger.warn({ err: appErr }, "Multer error");
    next(appErr);
    return;
  }
  // Continue if no error
});
```

### Cloudinary Error Handling

```typescript
// Service wraps errors
try {
  const result = await uploadBuffer(imageUpload.buffer, "products");
  return result.secure_url;
} catch (error) {
  logger.error({ err: error }, "Cloudinary upload failed");
  if (error instanceof AppError) {
    throw error;  // Re-throw known errors (503, 502, 400)
  }
  throw new AppError(502, "Failed to upload image to cloud storage");
}
```

### Central Error Handler

```typescript
// middleware/errorHandler.ts
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  logger.error({ err }, "Unexpected error");
  res.status(500).json({ message: "Internal server error" });
}
```

---

## Request Flow Diagrams

### Create Product with Image

```
Client (POST /api/products)
  ↓ [multipart/form-data]
Express Middleware Stack
  ├─ pinoHttp (logging)
  ├─ cors
  ├─ json (skipped for multipart)
  ├─ authenticate (JWT validation)
  ├─ uploadImage (Multer)
  └─ → productController.createProduct()
      ↓
  productService.create()
    ├─ validateFields()
    └─ resolveProductImage()
       ├─ uploadBuffer() [to Cloudinary]
       │  └─ stream buffer
       └─ receive secure_url
      ├─ validate business rules
      └─ productRepository.create()
         ├─ Product.create() [Mongoose]
         └─ save to MongoDB
  ↓
Response: 201 Created
{
  "_id": "...",
  "image": "https://res.cloudinary.com/..."
}
```

### List Products with Pagination

```
Client (GET /api/products?limit=10&skip=0)
  ↓
Express Middleware Stack
  ├─ pinoHttp
  ├─ cors
  ├─ json
  └─ → productController.getProducts()
      ↓
  parsePaginationParams(query)
    └─ validate limit (1-100), skip (≥0)
      ↓
  productService.findAll(pagination)
    ↓
  productRepository.findAll(pagination)
    ├─ Product.find().limit(10).skip(0)
    ├─ Product.countDocuments()
    └─ return { data, total, limit, skip, hasMore }
  ↓
Response: 200 OK
{
  "data": [...products],
  "total": 150,
  "limit": 10,
  "skip": 0,
  "hasMore": true
}
```

---

## Validation & Type Safety

### Pagination Validation

```typescript
// Ensures reasonable limits
function parsePaginationParams(query: any) {
  const limit = Math.max(1, Math.min(Number(query.limit) || 10, 100));
  //           ↑ min=1    ↑ max=100          ↑ default=10
  const skip = Math.max(0, Number(query.skip) || 0);
  //          ↑ min=0              ↑ default=0
  return { limit, skip };
}
```

### Image Type Safety

```typescript
interface ProductImageUpload {
  buffer: Buffer;
}

async function resolveProductImage(
  imageUrl: string | undefined,
  imageUpload?: ProductImageUpload
): Promise<string | undefined>

// Type-safe image handling
const product = await productService.create(
  productData,
  image ? { buffer: image.buffer } : undefined
  //    ↑ Ensures ProductImageUpload type
);
```

### Multer File Types

```typescript
// Only accepts these field names
const IMAGE_FIELDS = ["image", "file", "picture"] as const;

// Validation
if (file.mimetype.startsWith("image/")) {
  cb(null, true);  // Accept
} else {
  cb(new AppError(400, "Only image files are allowed"));
}

// Extraction
for (const field of IMAGE_FIELDS) {
  const fileArray = files[field];
  if (fileArray && Array.isArray(fileArray) && fileArray.length > 0) {
    return fileArray[0];  // Return first file from any valid field
  }
}
```

---

## Logging Strategy

### Upload Process Logging

1. **File Received** - Multer logs entry point
   ```
   File upload received { fieldname, mimetype, size }
   ```

2. **File Validated** - MIME type check
   ```
   Image validated { filename }
   // OR
   Invalid file type rejected { mimetype }
   ```

3. **Product Created** - Controller logs start
   ```
   Creating product { productName, hasImage }
   ```

4. **Image Upload** - Service logs process
   ```
   Uploading image to Cloudinary...
   ```

5. **Cloudinary Response** - Success/failure
   ```
   Image uploaded successfully to Cloudinary { url, publicId, size }
   // OR
   Cloudinary upload failed { err, errorCode }
   ```

### Log Levels

| Level | Event |
|-------|-------|
| `info` | File received, validated, upload start/success |
| `warn` | Invalid MIME type, multer error |
| `error` | Cloudinary failure, stream error, upload failure |
| `debug` | File extraction details |

---

## Database Schema (Unchanged)

```typescript
interface IProduct extends Document {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;              // ← Cloudinary URL, not binary
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    description: { type: String, required: [true, "Description is required"], trim: true },
    category: { type: String, required: [true, "Category is required"], trim: true },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    image: { type: String, required: [true, "Image is required"], trim: true },
    stock: { type: Number, required: [true, "Stock is required"], min: [0, "Stock cannot be negative"], default: 0 },
  },
  { timestamps: true }
);
```

---

## Performance Considerations

### Pagination Performance

```typescript
// MongoDB query optimization
Product.find()
  .sort({ createdAt: -1 })    // ← Uses index if available
  .limit(limit)               // ← Limits result set
  .skip(skip)                 // ← Efficient offset
  .exec();

// Parallel count for metadata
await Promise.all([
  Product.find()...exec(),     // ← Get data
  Product.countDocuments().exec()  // ← Count in parallel
]);
```

### Image Upload Performance

```typescript
// Memory buffering (not disk)
storage: multer.memoryStorage()    // ← Faster than disk
limits: { fileSize: MAX_FILE_SIZE }  // ← Prevents memory overflow

// Stream directly to Cloudinary
cloudinary.uploader.upload_stream()  // ← Streams from buffer to cloud
stream.end(buffer)                    // ← Efficient streaming
```

---

## Summary of Changes

| Area | Before | After |
|------|--------|-------|
| **Controllers** | 3 | 2 |
| **Image Upload** | Silent failures | Comprehensive logging |
| **Pagination** | None | Fully implemented |
| **Error Handling** | Basic | Enhanced with stream errors |
| **Logging** | Minimal | Detailed at each stage |
| **Buffer Validation** | None | Validates before upload |
| **Database** | Same | Same (only URLs stored) |

---

## Testing Commands

### Pagination

```bash
# First page
curl "http://localhost:5000/api/products?limit=10&skip=0"

# Second page
curl "http://localhost:5000/api/products?limit=10&skip=10"

# Check hasMore
curl "http://localhost:5000/api/products?limit=5&skip=0"
```

### Image Upload

```bash
# With image
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Test" \
  -F "description=Test" \
  -F "category=Test" \
  -F "price=10" \
  -F "stock=50" \
  -F "image=@image.jpg"

# Without image (should error)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test","category":"Test","price":10,"stock":50}'
```

### Error Cases

```bash
# Invalid MIME type
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Test" -F "description=Test" -F "category=Test" \
  -F "price=10" -F "stock=50" -F "image=@file.txt"

# File too large (>5MB)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Test" -F "description=Test" -F "category=Test" \
  -F "price=10" -F "stock=50" -F "image=@large_file.jpg"

# Missing token
curl -X POST http://localhost:5000/api/products \
  -F "name=Test" -F "description=Test" -F "category=Test" \
  -F "price=10" -F "stock=50" -F "image=@image.jpg"
```
