import { put, del } from "@vercel/blob";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

// Storage Provider Types
export type StorageProvider = "r2" | "vercel-blob" | "local";

export function getActiveStorageProvider(): StorageProvider {
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  ) {
    return "r2";
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return "vercel-blob";
  }
  return "local";
}

// S3 / Cloudflare R2 Client initialization
let r2Client: S3Client | null = null;
function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID || "";
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return r2Client;
}

export interface UploadResult {
  url: string;
  key: string;
  provider: StorageProvider;
  size: number;
}

/**
 * Upload a file directly from server buffer
 */
export async function uploadFileBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder: "audio" | "covers" = "audio"
): Promise<UploadResult> {
  const provider = getActiveStorageProvider();
  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const key = `${folder}/${safeFilename}`;

  // 1. Cloudflare R2
  if (provider === "r2") {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN ||
      `https://${bucket}.${process.env.R2_ACCOUNT_ID}.r2.dev`;
    const cleanDomain = publicDomain.replace(/\/+$/, "");
    return {
      url: `${cleanDomain}/${key}`,
      key,
      provider: "r2",
      size: buffer.length,
    };
  }

  // 2. Vercel Blob (requires a Public store for audio streaming)
  if (provider === "vercel-blob") {
    try {
      const blob = await put(key, buffer, {
        access: "public",
        contentType,
      });
      return {
        url: blob.url,
        key: blob.pathname,
        provider: "vercel-blob",
        size: buffer.length,
      };
    } catch (blobErr) {
      if (
        blobErr instanceof Error &&
        blobErr.message.toLowerCase().includes("private store")
      ) {
        throw new Error(
          "Votre Vercel Blob Store est configuré en mode 'Private'. Pour permettre la lecture audio et l'affichage des pochettes, créez un Blob Store en mode 'Public' dans votre dashboard Vercel (Storage > Create Database > Blob > Public)."
        );
      }
      throw blobErr;
    }
  }

  // 3. Local fallback (for local development without cloud keys)
  const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
  if (isProd) {
    throw new Error(
      "Stockage cloud non configuré sur Vercel : Veuillez activer Vercel Blob dans votre projet Vercel (onglet Storage > Blob) ou configurer vos variables Cloudflare R2."
    );
  }

  const localUploadDir = path.join(process.cwd(), "public", "uploads", folder);
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }

  const filePath = path.join(localUploadDir, safeFilename);
  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${folder}/${safeFilename}`,
    key,
    provider: "local",
    size: buffer.length,
  };
}

/**
 * Check storage configuration status
 */
export function getStorageInfo() {
  const provider = getActiveStorageProvider();
  const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
  const isConfigured =
    provider === "r2" || provider === "vercel-blob" || (!isProd && provider === "local");

  return {
    isConfigured,
    provider: isConfigured ? provider : "none",
    isProduction: isProd,
  };
}

/**
 * Generate a pre-signed URL or direct endpoint for direct browser-to-cloud upload.
 * Bypasses serverless function payload limits (4.5MB) for heavy .wav & .mp3 files up to 250MB+.
 */
export async function getDirectUploadUrl(
  filename: string,
  contentType: string,
  folder: "audio" | "covers" = "audio"
): Promise<{
  uploadUrl: string;
  finalPublicUrl: string;
  key: string;
  provider: StorageProvider | "none";
  error?: string;
}> {
  const provider = getActiveStorageProvider();
  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const key = `${folder}/${safeFilename}`;

  // 1. Cloudflare R2 direct S3 presigned PUT
  if (provider === "r2") {
    const client = getR2Client();
    const bucket = process.env.R2_BUCKET_NAME!;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN ||
      `https://${bucket}.${process.env.R2_ACCOUNT_ID}.r2.dev`;
    const cleanDomain = publicDomain.replace(/\/+$/, "");

    return {
      uploadUrl,
      finalPublicUrl: `${cleanDomain}/${key}`,
      key,
      provider: "r2",
    };
  }

  // 2. Vercel Blob client direct upload
  if (provider === "vercel-blob") {
    return {
      uploadUrl: "/api/upload/blob",
      finalPublicUrl: "",
      key,
      provider: "vercel-blob",
    };
  }

  // 3. Local fallback check
  const isProd = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
  if (isProd) {
    return {
      uploadUrl: "",
      finalPublicUrl: "",
      key,
      provider: "none",
      error:
        "Stockage cloud non configuré : Activez Vercel Blob dans le dashboard Vercel (onglet Storage > Blob) ou renseignez vos clés Cloudflare R2.",
    };
  }

  return {
    uploadUrl: "/api/upload",
    finalPublicUrl: "",
    key,
    provider: "local",
  };
}

/**
 * Delete a file cleanly from storage
 */
export async function deleteStoredFile(
  keyOrUrl: string,
  provider?: StorageProvider
): Promise<void> {
  const activeProvider = provider || getActiveStorageProvider();

  try {
    if (activeProvider === "r2") {
      const client = getR2Client();
      const bucket = process.env.R2_BUCKET_NAME!;
      const key = keyOrUrl.startsWith("http")
        ? new URL(keyOrUrl).pathname.replace(/^\/+/, "")
        : keyOrUrl;
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return;
    }

    if (activeProvider === "vercel-blob") {
      await del(keyOrUrl);
      return;
    }

    if (activeProvider === "local") {
      const cleanPath = keyOrUrl.replace(/^\/uploads\//, "");
      const fullPath = path.join(process.cwd(), "public", "uploads", cleanPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.error("Error deleting file:", err);
  }
}
