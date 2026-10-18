import { Response } from 'express';
import crypto from 'crypto';
import { Link, QrCode } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { SecurityService } from '../services/securityService.ts';

function generateShortCode(length = 6): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export class ImportsController {
  public static async processBulkImport(req: AuthRequest, res: Response) {
    const { rows } = req.body;
    const userId = req.user!._id;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Array of CSV rows is required.' });
    }

    if (rows.length > 500) {
      return res.status(400).json({ error: 'Bulk import is limited to 500 rows per batch.' });
    }

    const imported: any[] = [];
    const skipped: any[] = [];
    const batchAliases = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawUrl = (row.url || '').trim();

      if (!rawUrl) {
        skipped.push({ row: i + 1, error: 'Empty URL' });
        continue;
      }

      let dest = rawUrl;
      if (!dest.startsWith('http://') && !dest.startsWith('https://')) {
        dest = 'https://' + dest;
      }

      // Security & SSRF check
      const secEval = await SecurityService.evaluateUrl(dest);
      if (!secEval.valid) {
        skipped.push({ row: i + 1, url: dest, error: secEval.error || 'Security check failed' });
        continue;
      }

      // Custom alias or auto-generate
      let alias = (row.alias || '').trim().toLowerCase();
      if (alias) {
        if (batchAliases.has(alias)) {
          skipped.push({ row: i + 1, alias, error: 'Duplicate alias in batch' });
          continue;
        }
        const existing = await Link.findOne({ shortCode: alias });
        if (existing) {
          skipped.push({ row: i + 1, alias, error: 'Alias already in use' });
          continue;
        }
      } else {
        alias = generateShortCode(6);
      }

      batchAliases.add(alias);

      const tagsList = (row.tags || '')
        .split('|')
        .map((t: string) => t.trim())
        .filter(Boolean);

      try {
        const link = await Link.create({
          userId,
          destinationUrl: dest,
          shortCode: alias,
          title: (row.title || '').trim() || secEval.hostname || alias,
          tags: tagsList,
          isActive: true,
          status: 'active',
        });

        await QrCode.create({
          linkId: link._id,
          foregroundColor: '#171717',
          backgroundColor: '#FFFFFF',
          style: 'squares',
        });

        imported.push({
          id: String(link._id),
          shortCode: link.shortCode,
          destinationUrl: link.destinationUrl,
          title: link.title,
        });
      } catch (err: any) {
        skipped.push({ row: i + 1, error: err.message || 'Database insert failed' });
      }
    }

    return res.json({
      summary: {
        total: rows.length,
        imported: imported.length,
        successful: imported.length,
        skipped: skipped.length,
        failed: skipped.length,
      },
      imported,
      skipped,
    });
  }
}
