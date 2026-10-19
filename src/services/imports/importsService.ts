import { linkService } from '../links/linkService';
import { generateShortCode } from '../../lib/utils';

export const importsService = {
  async importBulk(
    rows: Array<{ url: string; alias?: string; title?: string; tags?: string }>
  ): Promise<{ summary: { total: number; imported: number; skipped: number }; imported: any[]; skipped: any[] }> {
    const imported: any[] = [];
    const skipped: any[] = [];

    const existingLinks = await linkService.getLinks();
    const existingCodes = new Set(existingLinks.map((l) => l.shortCode.toLowerCase()));

    for (const row of rows) {
      const code = (row.alias || generateShortCode(6)).trim().toLowerCase();
      if (existingCodes.has(code)) {
        skipped.push({ row, reason: `Alias ${code} already in use` });
        continue;
      }

      try {
        const link = await linkService.createLink({
          userId: 'usr_demo_user',
          originalUrl: row.url.trim(),
          shortCode: code,
          title: row.title || code,
          tags: row.tags ? row.tags.split('|').map((t) => t.trim()).filter(Boolean) : [],
        });
        existingCodes.add(code);
        imported.push(link);
      } catch (err: any) {
        skipped.push({ row, reason: err.message || 'Validation failed' });
      }
    }

    return {
      summary: {
        total: rows.length,
        imported: imported.length,
        skipped: skipped.length,
      },
      imported,
      skipped,
    };
  },
};
