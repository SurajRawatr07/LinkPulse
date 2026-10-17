import { Router } from 'express';
import { RedirectController } from '../controllers/redirectController.ts';

export const redirectRoutes = Router();

redirectRoutes.get('/api/v1/redirect/:code/metadata', RedirectController.resolveMetadata);
redirectRoutes.post('/api/v1/redirect/:code/verify-password', RedirectController.verifyPassword);
redirectRoutes.get('/r/:code', RedirectController.handleRedirect);
