import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('dbClinet', () => {
  before(async () => {
    await dbClient.client.connect(); // Ensure the DB client is connected
  });

  after(async () => {
    await dbClient.client.close(); // close the db client after test
  });

  it('should be connected to the database', () => {
    expect(dbClient.isAlive()).to.be.true;
  });

  describe('nbUsers()', () => {
    it('should return the number of users', async () => {
      const usercount = await dbClient.nbUsers();
      expect(usercount).to.be.a('number');
    });
  });

  describe('nbFiles()', ()=> {
    it('should return the number of files', async () => {
      const filecount = await dbClient.nbFiles();
      expect(filecount).to.be.a('number');
    });
  });
});
