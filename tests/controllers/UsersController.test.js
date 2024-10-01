import request from 'supertest';
import { expect } from 'chai';
import { ObjectId } from 'mongodb';
import dbClient from '../../utils/db';
import app from '../../server';

describe('User Endpoint', () => {
  let userID;
  let userToken;

  // Move userData to the outer scope
  const userData = {
    email: 'npm@example.test',
    password: '02356', 
  };

  beforeEach(async () => {
    await dbClient.client.db().collection('users').deleteMany({});
  });

  describe('POST /users', () => {
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

  describe('GET /users/me', () => {
    before(async () => {
      const res = await request(app).get('/connect').auth(userData.email, userData.password);
      userToken = res.body.token;
    });

    it('should return authenticated user information', async () => {
      const res = await request(app).get('/users/me').set('X-Token', userToken);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', userID);
      expect(res.body).to.have.property('email', userData.email);
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).get('/users/me').set('x-token', '');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no user id found)', async () => {
      const res = await request(app).get('/users/me').set('x-token', 'notAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });
  });

  after(async () => {
    if (userID) {
      await dbClient.client.db().collection('users').deleteOne({ _id: new ObjectId(userID) });
    }
  });
});
