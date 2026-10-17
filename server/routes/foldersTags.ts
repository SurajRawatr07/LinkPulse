import { Router, Response } from 'express';
import { db } from '../../src/db/index.ts';
import { folders, tags, links, linkTags } from '../../src/db/schema.ts';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';

export const foldersTagsRouter = Router();

// --- Folders ---
foldersTagsRouter.get('/folders', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const userFolders = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId));

    const folderIds = userFolders.map((f) => f.id);
    let counts: Record<number, number> = {};

    if (folderIds.length > 0) {
      const linkCounts = await db
        .select({
          folderId: links.folderId,
          count: sql<number>`count(*)`,
        })
        .from(links)
        .where(and(eq(links.userId, userId), inArray(links.folderId, folderIds)))
        .groupBy(links.folderId);

      linkCounts.forEach((r) => {
        if (r.folderId) counts[r.folderId] = Number(r.count);
      });
    }

    const items = userFolders.map((f) => ({
      ...f,
      linkCount: counts[f.id] || 0,
    }));

    return res.json({ items });
  } catch (error) {
    console.error('List folders error:', error);
    return res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

foldersTagsRouter.post('/folders', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, color = '#18181B' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  try {
    const [newFolder] = await db
      .insert(folders)
      .values({
        userId,
        name: name.trim(),
        color,
      })
      .returning();

    return res.status(201).json({ folder: newFolder });
  } catch (error) {
    console.error('Create folder error:', error);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
});

foldersTagsRouter.delete('/folders/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const folderId = parseInt(req.params.id);

  try {
    await db
      .update(links)
      .set({ folderId: null })
      .where(and(eq(links.folderId, folderId), eq(links.userId, userId)));

    const [deleted] = await db
      .delete(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    return res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    console.error('Delete folder error:', error);
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// --- Tags ---
foldersTagsRouter.get('/tags', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId));

    const tagIds = userTags.map((t) => t.id);
    let counts: Record<number, number> = {};

    if (tagIds.length > 0) {
      const tagCounts = await db
        .select({
          tagId: linkTags.tagId,
          count: sql<number>`count(*)`,
        })
        .from(linkTags)
        .where(inArray(linkTags.tagId, tagIds))
        .groupBy(linkTags.tagId);

      tagCounts.forEach((r) => {
        counts[r.tagId] = Number(r.count);
      });
    }

    const items = userTags.map((t) => ({
      ...t,
      linkCount: counts[t.id] || 0,
    }));

    return res.json({ items });
  } catch (error) {
    console.error('List tags error:', error);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

foldersTagsRouter.post('/tags', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { name, color = '#18181B' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Tag name is required' });
  }

  try {
    const [newTag] = await db
      .insert(tags)
      .values({
        userId,
        name: name.trim(),
        color,
      })
      .returning();

    return res.status(201).json({ tag: newTag });
  } catch (error) {
    console.error('Create tag error:', error);
    return res.status(500).json({ error: 'Failed to create tag' });
  }
});

foldersTagsRouter.delete('/tags/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const tagId = parseInt(req.params.id);

  try {
    const [deleted] = await db
      .delete(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    return res.json({ success: true, message: 'Tag deleted' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return res.status(500).json({ error: 'Failed to delete tag' });
  }
});
