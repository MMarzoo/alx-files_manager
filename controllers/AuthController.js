import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedInfo = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
    const [email, password] = decodedInfo.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hashedPassword = sha1(password);
    const user = await dbClient.client.db().collection('users').findOne({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const tokenKey = `auth_${token}`;
    redisClient.set(tokenKey, user._id.toString(), 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    try {
      const userToken = req.header('X-Token');
      const userKey = await redisClient.get(`auth_${userToken}`);

      if (!userKey) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      await redisClient.del(`auth_${userToken}`);
      res.status(204).send('Disconnected');
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export default AuthController;
