import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "entry-images";

export function getPublicUrl(key: string): string {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}

export async function uploadFile(
  key: string,
  body: ArrayBuffer | Buffer,
  contentType: string
): Promise<void> {
  await R2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: new Uint8Array(body),
      ContentType: contentType,
    })
  );
}

export async function deleteFile(key: string): Promise<void> {
  await R2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export async function deleteFolder(prefix: string): Promise<void> {
  const listed = await R2.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  if (!listed.Contents || listed.Contents.length === 0) return;

  await R2.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: listed.Contents.map((obj) => ({ Key: obj.Key })),
      },
    })
  );
}
