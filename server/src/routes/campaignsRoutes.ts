import { Router } from 'express';
import { CampaignsController } from '../controllers/campaignsController.ts';
import { requireAuth } from '../middleware/auth.ts';

export const campaignsRoutes = Router();

campaignsRoutes.use(requireAuth);

campaignsRoutes.get('/', CampaignsController.getCampaigns);
campaignsRoutes.post('/', CampaignsController.createCampaign);
campaignsRoutes.patch('/:id', CampaignsController.updateCampaign);
campaignsRoutes.delete('/:id', CampaignsController.deleteCampaign);
