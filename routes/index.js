import { Router } from 'express';
import AppController from '../controllers/AppController';

const route = Router();

route.get('/status', AppController.getStatus);
route.get('/stats', AppController.getStats);

export default route;
