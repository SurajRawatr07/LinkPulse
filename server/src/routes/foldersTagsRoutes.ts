import { Router } from 'express';
import { FoldersTagsController } from '../controllers/foldersTagsController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const foldersTagsRoutes = Router();

foldersTagsRoutes.use(requireAuth);

foldersTagsRoutes.get('/folders', FoldersTagsController.getFolders);
foldersTagsRoutes.post('/folders', FoldersTagsController.createFolder);
foldersTagsRoutes.delete('/folders/:id', FoldersTagsController.deleteFolder);

foldersTagsRoutes.get('/tags', FoldersTagsController.getTags);
foldersTagsRoutes.post('/tags', FoldersTagsController.createTag);
foldersTagsRoutes.delete('/tags/:id', FoldersTagsController.deleteTag);
