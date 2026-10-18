import { Router } from 'express';
import { LinksController } from '../controllers/linksController.ts';
import { requireAuth } from '../middleware/auth.ts';
import { creationRateLimiter } from '../middleware/rateLimit.ts';

export const linksRoutes = Router();

// Public alias availability check
linksRoutes.get('/check-alias', LinksController.checkAlias);

linksRoutes.use(requireAuth);

linksRoutes.get('/', LinksController.getLinks);
linksRoutes.post('/', creationRateLimiter, LinksController.createLink);
linksRoutes.get('/:id', LinksController.getLink);
linksRoutes.patch('/:id', LinksController.updateLink);
linksRoutes.delete('/:id', LinksController.deleteLink);
