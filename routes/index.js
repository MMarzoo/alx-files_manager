import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const route = Router();

route.get('/status', AppController.getStatus);
route.get('/stats', AppController.getStats);

route.post('/users', UsersController.postNew);
route.get('/users/me', UsersController.getMe);

route.get('/connect', AuthController.getConnect);
route.get('/disconnect', AuthController.getDisconnect);

export default route;
