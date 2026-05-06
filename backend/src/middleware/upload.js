// src/middleware/upload.js - Cloudflare R2 / local file uploads
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const isConfiguredValue = (value) => {
  if (!value) return false;
  return !/your-|xxxxx|example/i.test(value);
};

const hasR2Config = [
  process.env.R2_ACCOUNT_ID,
  process.env.R2_ACCESS_KEY_ID,
  process.env.R2_SECRET_ACCESS_KEY,
  process.env.R2_PUBLIC_URL,
].every(isConfiguredValue);

const s3 = hasR2Config
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

const BUCKET = process.env.R2_BUCKET_NAME || "pragati-files";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
const LOCAL_UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;

const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp"],
  document: ["application/pdf", "image/jpeg", "image/png"],
  any: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

const storage = multer.memoryStorage();

const fileFilter = (allowedCategory) => (req, file, cb) => {
  const allowed = ALLOWED_TYPES[allowedCategory] || ALLOWED_TYPES.any;
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error(`File type ${file.mimetype} not allowed. Allowed: ${allowed.join(", ")}`), false);
};

const uploadPhoto = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: fileFilter("image") });
const uploadDocument = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: fileFilter("document") });
const uploadAny = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: fileFilter("any") });

const ensureLocalFolder = (folder) => {
  const targetDir = path.join(LOCAL_UPLOAD_ROOT, folder);
  fs.mkdirSync(targetDir, { recursive: true });
  return targetDir;
};

const uploadToLocal = async (file, folder = "general") => {
  const ext = path.extname(file.originalname) || "";
  const fileName = `${crypto.randomUUID()}${ext}`;
  const targetDir = ensureLocalFolder(folder);
  const targetPath = path.join(targetDir, fileName);
  const key = path.posix.join(folder, fileName);

  await fs.promises.writeFile(targetPath, file.buffer);

  return {
    key,
    url: `${BACKEND_PUBLIC_URL}/uploads/${key}`,
    name: file.originalname,
    size: file.size,
    type: file.mimetype,
  };
};

const uploadToR2 = async (file, folder = "general") => {
  if (!hasR2Config || !s3) {
    return uploadToLocal(file, folder);
  }

  const ext = path.extname(file.originalname);
  const filename = `${folder}/${crypto.randomUUID()}${ext}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    return {
      key: filename,
      url: `${PUBLIC_URL}/${filename}`,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
    };
  } catch (error) {
    console.warn("[UPLOAD] Falling back to local storage:", error.message);
    return uploadToLocal(file, folder);
  }
};

const deleteFromR2 = async (key) => {
  if (!hasR2Config || !s3) {
    const localPath = path.join(LOCAL_UPLOAD_ROOT, key);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }
    return;
  }

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

const getPresignedUrl = async (folder, filename, contentType) => {
  if (!hasR2Config || !s3) {
    throw new Error("Presigned uploads require Cloudflare R2 configuration");
  }

  const key = `${folder}/${crypto.randomUUID()}-${filename}`;
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  return { url, key, publicUrl: `${PUBLIC_URL}/${key}` };
};

const handleUpload = (folder) => async (req, res, next) => {
  if (!req.file) return res.status(400).json({ code: "NO_FILE", message: "No file uploaded" });
  try {
    req.uploadedFile = await uploadToR2(req.file, folder);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadPhoto,
  uploadDocument,
  uploadAny,
  uploadToR2,
  deleteFromR2,
  getPresignedUrl,
  handleUpload,
};
