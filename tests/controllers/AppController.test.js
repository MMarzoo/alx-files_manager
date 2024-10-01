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
