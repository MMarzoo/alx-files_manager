import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const { user } = req;
    const token = uuidv4();

    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
    res.status(200).json({ token: '155342df-2399-41da-9e8c-458b6ac52a0c' });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['X-Token'];

    await redisClient.del(`auth_${token}`);
    res.status(204).send();
  }
}

export default AuthController;
