import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('redisClient', () => {
  it('should be Alive', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set and get a value in Redis', async () => {
    await redisClient.set('test_key', 'test_value', 10);
    const value = await redisClient.get('test_key');
    expect(value).to.equal('test_value');
  });

  it('should delete a value in Redis', async () => {
    await redisClient.set('del_key', 'to_del', 10);
    await redisClient.del('del_key');
    const value = await redisClient.get('del_key');
    expect(value).to.be.null;
  });
});
