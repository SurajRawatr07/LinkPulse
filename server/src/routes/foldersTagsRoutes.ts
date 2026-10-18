import { Router } from 'express';
import { FoldersTagsController } from '../controllers/foldersTagsController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const foldersTagsRoutes = Router();

// Protect folder and tag endpoints explicitly
foldersTagsRoutes.get('/folders', requireAuth, FoldersTagsController.getFolders);
foldersTagsRoutes.post('/folders', requireAuth, FoldersTagsController.createFolder);
foldersTagsRoutes.delete('/folders/:id', requireAuth, FoldersTagsController.deleteFolder);

foldersTagsRoutes.get('/tags', requireAuth, FoldersTagsController.getTags);
foldersTagsRoutes.post('/tags', requireAuth, FoldersTagsController.createTag);
foldersTagsRoutes.delete('/tags/:id', requireAuth, FoldersTagsController.deleteTag);
