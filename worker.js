import Queue from 'bull';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.client.db().collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!file) {
    throw new Error('File not found');
  }

  const Sizes = [500, 250, 100];
  const thumbnailPromises = Sizes.map(async (size) => {
    const thumbnail = await imageThumbnail(file.localPath, { width: size });
    fs.writeFileSync(`${file.localPath}_${size}`, thumbnail);
  });

  await Promise.all(thumbnailPromises);
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  if (!userId) {
    throw new Error('Missing userId');
  }

  const user = await dbClient.client.db().collection('users').findOne({ _id: ObjectId(userId) });

  if (!user) {
    throw new Error('User not found');
  }

  console.log(`Welcome ${user.email}!`);
});
