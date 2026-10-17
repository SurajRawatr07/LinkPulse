import { Router } from 'express';
import { RedirectController } from '../controllers/redirectController.ts';

export const redirectRoutes = Router();

redirectRoutes.post('/api/v1/redirect/:code/verify-password', RedirectController.verifyPassword);
redirectRoutes.get('/r/:code', RedirectController.handleRedirect);
