import request from 'supertest';
import { expect } from 'chai';
import app from '../../server';
import redisClient from '../../utils/redis';
import dbClient from '../../utils/db';

describe('App Endpoints', () => {
  describe('GET /status', () => {
    before(() => {
      // Mock the redisClient and dbClient responses
      redisClient.isAlive = () => true;
      dbClient.isAlive = () => true;
    });

    it('should return status of redis and DB', async () => {
      const res = await request(app).get('/status');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('redis', true);
      expect(res.body).to.have.property('db', true);
    });

    it('should return false if redis or DB is down', async () => {
      // Simulate redis and db being down
      redisClient.isAlive = () => false;
      dbClient.isAlive = () => false;

      const res = await request(app).get('/status');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('redis', false);
      expect(res.body).to.have.property('db', false);
    });
  });
});

describe('GET /stats', () => {
  before(() => {
    // Mock dbClient methods for the stats
    dbClient.nbUsers = () => Promise.resolve(5); //  Mock the number of users
    dbClient.nbFiles = () => Promise.resolve(10); // Mock the number of posts
  });

  it('should return the number of users and files', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('users', 5);
    expect(res.body).to.have.property('files', 10);
  });
});