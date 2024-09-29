import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    try {
      const userToken = req.header('X-Token');
      const authKey = `auth_${userToken}`;
      const userID = await redisClient.get(authKey);

      if (!userID) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name,
        type,
        parentId = 0,
        isPublic = false,
        data,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      const allowedTypes = ['folder', 'file', 'image'];
      if (!type || !allowedTypes.includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      let parentFile = 0;
      if (parentId !== 0) {
        parentFile = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(parentId) });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const userObjectId = new ObjectId(userID);

      const newFile = {
        userId: userObjectId,
        name,
        type,
        isPublic,
        parentId: parentId === '0' ? '0' : ObjectId(parentId),
      };

      if (type === 'folder') {
        const result = await dbClient.client.db().collection('files').insertOne(newFile);
        return res.status(201).json({ id: result.insertedId, ...newFile });
      }

      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const fileUuid = uuidv4();
      const localPath = path.join(folderPath, fileUuid);

      const decodedData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, decodedData);

      newFile.localPath = localPath;

      const result = await dbClient.client.db().collection('files').insertOne(newFile);

      return res.status(201).json({ id: result.insertedId, ...newFile });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
}

export default FilesController;
