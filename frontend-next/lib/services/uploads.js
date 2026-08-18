import { ObjectId } from "mongodb";
import { getBucket } from "@/lib/db/gridfs";

export async function storeImage(buffer, contentType, filename) {
  const bucket = await getBucket();
  const uploadStream = bucket.openUploadStream(filename || "upload", {
    metadata: { content_type: contentType },
  });
  await new Promise((resolve, reject) => {
    uploadStream.end(buffer, (err) => (err ? reject(err) : resolve()));
  });
  return uploadStream.id.toString();
}

// Returns null on any not-found/invalid-id condition (mirrors the 404 in server.py).
export async function streamImage(fileId) {
  let oid;
  try {
    oid = new ObjectId(fileId);
  } catch {
    return null;
  }
  const bucket = await getBucket();
  const files = await bucket.find({ _id: oid }).toArray();
  if (!files.length) return null;
  const contentType = files[0].metadata?.content_type || "application/octet-stream";
  const chunks = [];
  try {
    await new Promise((resolve, reject) => {
      const stream = bucket.openDownloadStream(oid);
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", resolve);
    });
  } catch {
    return null;
  }
  return { buffer: Buffer.concat(chunks), contentType };
}
