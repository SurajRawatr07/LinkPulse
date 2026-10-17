import { Router } from 'express';
import { ExperimentsController } from '../controllers/experimentsController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const experimentsRoutes = Router();

experimentsRoutes.use(requireAuth);

experimentsRoutes.get('/', ExperimentsController.getExperiments);
experimentsRoutes.post('/:id', ExperimentsController.configureExperiment);
