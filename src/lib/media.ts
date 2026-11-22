import { createHash } from 'node:crypto';
import { AwsClient } from 'aws4fetch';
import type { MediaAsset, MediaVisibility } from '@prisma/client';
import { prisma } from './prisma';
import { slugify } from './utils';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_PDF_BYTES = 30 * 1024 * 1024;

type DetectedType = 'pdf' | 'jpeg' | 'png' | 'webp';

const MIME_BY_TYPE: Record<DetectedType, string> = {
  pdf: 'application/pdf',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Verifica o tipo real do arquivo pelos bytes iniciais, não pela extensão
 * nem pelo Content-Type informado pelo navegador.
 */
export function detectFileType(buffer: Buffer): DetectedType | null {
  if (buffer.length < 12) return null;
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

function storageDriver(): 'db' | 's3' {
  return process.env.STORAGE_DRIVER === 's3' ? 's3' : 'db';
}

function s3Config() {
  const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '');
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('Armazenamento S3 configurado sem S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY.');
  }
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: process.env.S3_REGION || 'auto',
  });
  return { endpoint, bucket, client };
}

function objectUrl(key: string): string {
  const { endpoint, bucket } = s3Config();
  return `${endpoint}/${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

async function uploadToS3(key: string, body: Buffer, contentType: string): Promise<void> {
  const { client } = s3Config();
  const response = await client.fetch(objectUrl(key), {
    method: 'PUT',
    body: new Uint8Array(body),
    headers: { 'Content-Type': contentType },
  });
  if (!response.ok) {
    throw new Error(`Falha ao enviar arquivo para o bucket (${response.status}).`);
  }
}

async function downloadFromS3(key: string): Promise<Buffer> {
  const { client } = s3Config();
  const response = await client.fetch(objectUrl(key), { method: 'GET' });
  if (!response.ok) throw new Error(`Arquivo indisponível no bucket (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

async function deleteFromS3(key: string): Promise<void> {
  const { client } = s3Config();
  await client.fetch(objectUrl(key), { method: 'DELETE' });
}

export type SaveMediaInput = {
  file: File;
  visibility: MediaVisibility;
  allowed: 'image' | 'pdf';
};

export async function saveMedia({ file, visibility, allowed }: SaveMediaInput): Promise<MediaAsset> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const limit = allowed === 'pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (buffer.length === 0) throw new Error('Arquivo vazio.');
  if (buffer.length > limit) {
    throw new Error(
      allowed === 'pdf' ? 'O PDF deve ter no máximo 30 MB.' : 'A imagem deve ter no máximo 8 MB.',
    );
  }

  const detected = detectFileType(buffer);
  if (!detected) throw new Error('Formato não reconhecido. Envie PDF, JPG, PNG ou WebP.');
  if (allowed === 'pdf' && detected !== 'pdf') throw new Error('Envie um arquivo PDF válido.');
  if (allowed === 'image' && detected === 'pdf') throw new Error('Envie uma imagem JPG, PNG ou WebP.');

  const mimeType = MIME_BY_TYPE[detected];
  const checksum = createHash('sha256').update(buffer).digest('hex');
  const driver = storageDriver();
  const key = `${visibility.toLowerCase()}/${new Date().getFullYear()}/${checksum.slice(0, 16)}-${slugify(
    file.name,
  ).slice(0, 80) || 'arquivo'}`;

  if (driver === 's3') await uploadToS3(key, buffer, mimeType);

  return prisma.mediaAsset.create({
    data: {
      storageKey: key,
      fileName: file.name.slice(0, 200),
      mimeType,
      sizeBytes: buffer.length,
      visibility,
      driver,
      data: driver === 'db' ? buffer : null,
    },
  });
}

export async function readMedia(media: Pick<MediaAsset, 'driver' | 'storageKey' | 'data'>): Promise<Buffer> {
  if (media.driver === 's3') return downloadFromS3(media.storageKey);
  if (!media.data) throw new Error('Arquivo não encontrado no armazenamento.');
  return Buffer.from(media.data);
}

export async function deleteMedia(id: string): Promise<void> {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media) return;
  if (media.driver === 's3') {
    try {
      await deleteFromS3(media.storageKey);
    } catch {
      // O registro sai do banco mesmo que o objeto já não exista.
    }
  }
  await prisma.mediaAsset.delete({ where: { id } });
}

export function mediaUrl(id: string): string {
  return `/api/media/${id}`;
}
