import request from 'supertest';
import { expect, use } from 'chai';
import { ObjectId } from 'mongodb';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import app from '../../server';

describe('User Endpoint', () => {
  let userID;

  beforeEach(async () => {
    await  dbClient.client.db().collection('users').deleteMany({});
  });

  describe('POST /users', () => {
    const userData = {
      email: 'npm@example.test',
      password: '02356', 
    };

    it('should create a new user', async () => {
      const res = await request(app).post('/users').send(userData);
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id').that.is.a('string');
      expect(res.body).to.have.property('email', userData.email);

      userID = res.body.id;
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app).post('/users').send({ email: 'npm@example.test' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Missing password');
    });

    it('should return 400 for existing user', async () => {
      await request(app).post('/users').send(userData);
      const res = await request(app).post('/users').send(userData);
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error', 'Already exist');
    });
  });

  after(async () => {
    if (userID) {
      await dbClient.client.db().collection('users').deleteOne({ _id: new ObjectId(userID) });
    }
  });
});
