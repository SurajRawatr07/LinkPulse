import { Response } from 'express';
import { Folder, Tag, Link } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export class FoldersTagsController {
  // Folders
  public static async getFolders(req: AuthRequest, res: Response) {
    const userId = req.user!._id;
    const query: any = req.user!.role === 'admin' ? {} : { userId };

    try {
      const items = await Folder.find(query).sort({ name: 1 }).lean();
      return res.json({
        items: items.map((f) => ({
          id: String(f._id),
          name: f.name,
          color: f.color,
          createdAt: new Date(f.createdAt).toISOString(),
        })),
      });
    } catch (error) {
      console.error('Get folders error:', error);
      return res.status(500).json({ error: 'Failed to retrieve folders.' });
    }
  }

  public static async createFolder(req: AuthRequest, res: Response) {
    const { name, color = '#18181B' } = req.body;
    const userId = req.user!._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required.' });
    }

    try {
      const folder = await Folder.create({
        name: name.trim(),
        color,
        userId,
      });

      return res.status(201).json({
        folder: {
          id: String(folder._id),
          name: folder.name,
          color: folder.color,
          createdAt: new Date(folder.createdAt).toISOString(),
        },
      });
    } catch (error) {
      console.error('Create folder error:', error);
      return res.status(500).json({ error: 'Failed to create folder.' });
    }
  }

  public static async deleteFolder(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!._id;

    try {
      const folder = await Folder.findById(id);
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found.' });
      }

      if (req.user!.role !== 'admin' && String(folder.userId) !== String(userId)) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      await Promise.all([
        Folder.deleteOne({ _id: folder._id }),
        Link.updateMany({ folderId: folder._id }, { $unset: { folderId: 1 } }),
      ]);

      return res.json({ message: 'Folder deleted.' });
    } catch (error) {
      console.error('Delete folder error:', error);
      return res.status(500).json({ error: 'Failed to delete folder.' });
    }
  }

  // Tags
  public static async getTags(req: AuthRequest, res: Response) {
    const userId = req.user!._id;
    const query: any = req.user!.role === 'admin' ? {} : { userId };

    try {
      const items = await Tag.find(query).sort({ name: 1 }).lean();
      return res.json({
        items: items.map((t) => ({
          id: String(t._id),
          name: t.name,
          color: t.color,
          createdAt: new Date(t.createdAt).toISOString(),
        })),
      });
    } catch (error) {
      console.error('Get tags error:', error);
      return res.status(500).json({ error: 'Failed to retrieve tags.' });
    }
  }

  public static async createTag(req: AuthRequest, res: Response) {
    const { name, color = '#18181B' } = req.body;
    const userId = req.user!._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tag name is required.' });
    }

    try {
      const tag = await Tag.create({
        name: name.trim(),
        color,
        userId,
      });

      return res.status(201).json({
        tag: {
          id: String(tag._id),
          name: tag.name,
          color: tag.color,
          createdAt: new Date(tag.createdAt).toISOString(),
        },
      });
    } catch (error) {
      console.error('Create tag error:', error);
      return res.status(500).json({ error: 'Failed to create tag.' });
    }
  }

  public static async deleteTag(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user!._id;

    try {
      const tag = await Tag.findById(id);
      if (!tag) {
        return res.status(404).json({ error: 'Tag not found.' });
      }

      if (req.user!.role !== 'admin' && String(tag.userId) !== String(userId)) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      await Promise.all([
        Tag.deleteOne({ _id: tag._id }),
        Link.updateMany({ tags: tag.name }, { $pull: { tags: tag.name } }),
      ]);

      return res.json({ message: 'Tag deleted.' });
    } catch (error) {
      console.error('Delete tag error:', error);
      return res.status(500).json({ error: 'Failed to delete tag.' });
    }
  }
}
