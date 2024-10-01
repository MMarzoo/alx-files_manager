import request from 'supertest';
import { expect } from 'chai';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import app from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

describe('AuthController', () => {
  const userData = {
    email: 'npm@example.test',
    password: 'password123',
  };
  let userToken;

  before(async () => {
    // Ensure the user is created for testing
    const hashedPassword = sha1(userData.password);
    await dbClient.client.db().collection('users').insertOne({
      email: userData.email,
      password: hashedPassword,
    });

    const auth = Buffer.from(`${userData.email}:${userData.password}`).toString('base64');
    const res = await request(app).get('/connect').set('Authorization', `Basic ${auth}`);
    userToken = res.body.token;
  });

  after(async () => {
    // clean up after tests
    await dbClient.client.db().collection('users').deleteMany({});
    if (userToken){
      await redisClient.del(`auth_${userToken}`); // Clean up token from Redis
    }
  });

  describe('GET /connect', () => {
    it('should return a token for valid credentials', async () => {
      const auth = Buffer.from(`${userData.email}:${userData.password}`).toString('base64');
      const res = await request(app).get('/connect').set('Authorization', `Basic ${auth}`);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('token').that.is.a('string');
    });

    it('should return 401 for missing Authorization header', async () => {
      const res = await request(app).get('/connect');

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for invalid credentials', async () => {
      const auth = Buffer.from(`${userData.email}:wrongpassword`).toString('base64');
      const res = await request(app).get('/connect').set('Authorization', `Basic ${auth}`);

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });

  describe('GET /disconnect', () => {
    it('should disconnect the user for a valid token', async() => {
      const res = await request(app).get('/disconnect').set('X-Token', userToken);

      expect(res.status).to.equal(204);
      expect(res.body).to.be.empty;
    });

    it('should return 401 for unauthorized (invalid token)', async () => {
      const res = await request(app).get('/disconnect').set('X-Token', 'invalidToken');

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (missing token)', async () => {
      const res = await request(app).get('/disconnect');

      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });
});
