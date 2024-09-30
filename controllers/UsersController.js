import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import Queue from 'bull';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const userQueue = new Queue('userQueue');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingUser = await dbClient.client.db().collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);

    const newUser = {
      email,
      password: hashedPassword,
    };

    const result = await dbClient.client.db().collection('users').insertOne(newUser);

    await userQueue.add({ userID: result.insertedId });

    return res.status(201).json({
      id: result.insertedId,
      email,
    });
  }

  static async getMe(req, res) {
    try {
      const userToken = req.header('X-Token');
      const authKey = `auth_${userToken}`;
      const userID = await redisClient.get(authKey);
      console.log('USER KEY GET ME', userID);
      if (!userID) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userID) });
      res.json({ id: user._id, email: user.email });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export default UsersController;
