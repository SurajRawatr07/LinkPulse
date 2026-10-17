import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../../src/db/index.ts';
import {
  links,
  qrCodes,
  importJobs,
  domainBlocklist,
} from '../../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

export const importsRouter = Router();

const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateRandomCode(length = 6): string {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % BASE62.length];
  }
  return result;
}

interface ImportRow {
  destination_url: string;
  custom_alias?: string;
  title?: string;
  campaign?: string;
  expiry_date?: string;
  tags?: string;
}

importsRouter.post('/csv', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { rows, filename = 'links.csv' } = req.body as {
    rows: ImportRow[];
    filename?: string;
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No data rows provided for import' });
  }

  if (rows.length > 500) {
    return res.status(400).json({ error: 'Import limited to maximum 500 rows per batch' });
  }

  // Load blocked domains
  const blockedRows = await db.select({ domain: domainBlocklist.domain }).from(domainBlocklist);
  const blockedSet = new Set(blockedRows.map((b) => b.domain.toLowerCase()));

  const successful: any[] = [];
  const failed: { row: number; data: ImportRow; error: string }[] = [];
  const seenAliases = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const dest = row.destination_url?.trim();

    if (!dest) {
      failed.push({ row: rowNum, data: row, error: 'Missing destination_url' });
      continue;
    }

    if (!/^https?:\/\//i.test(dest)) {
      failed.push({ row: rowNum, data: row, error: 'Destination URL must start with http:// or https://' });
      continue;
    }

    if (/^(javascript|data|vbscript|file):/i.test(dest)) {
      failed.push({ row: rowNum, data: row, error: 'Unsafe or unsupported protocol' });
      continue;
    }

    try {
      const parsed = new URL(dest);
      if (blockedSet.has(parsed.hostname.toLowerCase())) {
        failed.push({ row: rowNum, data: row, error: `Domain ${parsed.hostname} is blocklisted` });
        continue;
      }
    } catch {
      failed.push({ row: rowNum, data: row, error: 'Malformed URL' });
      continue;
    }

    let alias = row.custom_alias?.trim();
    if (alias) {
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(alias)) {
        failed.push({ row: rowNum, data: row, error: 'Alias must be 3-30 letters/numbers/-/_' });
        continue;
      }
      if (seenAliases.has(alias.toLowerCase())) {
        failed.push({ row: rowNum, data: row, error: 'Duplicate alias in same CSV file' });
        continue;
      }
      // Check database collision
      const existing = await db
        .select({ id: links.id })
        .from(links)
        .where(eq(links.shortCode, alias))
        .limit(1);

      if (existing.length > 0) {
        failed.push({ row: rowNum, data: row, error: `Alias '${alias}' already taken in database` });
        continue;
      }
      seenAliases.add(alias.toLowerCase());
    } else {
      alias = generateRandomCode(6);
      seenAliases.add(alias.toLowerCase());
    }

    // Expiry date parse
    let expDate: Date | null = null;
    if (row.expiry_date?.trim()) {
      const parsedDate = new Date(row.expiry_date.trim());
      if (!isNaN(parsedDate.getTime())) {
        expDate = parsedDate;
      }
    }

    try {
      const [newLink] = await db
        .insert(links)
        .values({
          userId,
          shortCode: alias,
          destinationUrl: dest,
          title: row.title?.trim() || alias,
          expiresAt: expDate,
        })
        .returning();

      // Create QR code
      await db.insert(qrCodes).values({
        linkId: newLink.id,
        foregroundColor: '#171717',
        backgroundColor: '#FFFFFF',
        style: 'squares',
      });

      successful.push(newLink);
    } catch (err: any) {
      failed.push({ row: rowNum, data: row, error: err.message || 'Database insert failed' });
    }
  }

  // Record import job
  try {
    await db.insert(importJobs).values({
      userId,
      filename,
      totalRows: rows.length,
      successRows: successful.length,
      failedRows: failed.length,
      status: failed.length === 0 ? 'completed' : successful.length > 0 ? 'partial' : 'failed',
      errorsJson: failed.length > 0 ? JSON.stringify(failed.slice(0, 50)) : null,
    });
  } catch (err) {
    console.error('Failed to log import job:', err);
  }

  return res.json({
    total: rows.length,
    successCount: successful.length,
    failedCount: failed.length,
    successful,
    failed,
  });
});
