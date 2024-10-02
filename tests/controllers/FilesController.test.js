import request from 'supertest';
import { expect } from 'chai';
import app from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import { ObjectId } from 'mongodb';

describe('File Endpoint', () => {
  let userId;
  let token;
  let fileId;
  let folderId;

  const userData = {
    email: 'test@example.com',
    password: 'password321',
  };

  const fileData = {
    name: 'testexample.txt',
    type: 'file',
    data: Buffer.from('Hello, World!').toString('base64'),
  };

  before(async () => {
    const resId = await request(app).post('/users').send(userData);
    console.log('User creation response:', resId.body);
    userId = resId.body.id;
    console.log('User ID:', userId);

    const resToken = await request(app).get('/connect').auth(userData.email, userData.password);
    token = resToken.body.token;
    console.log('Token:', token);
  });

  describe('POST /files', () => {
    it('should upload a new file', async () => {
      const res = await request(app)
        .post('/files')
        .set('X-Token', token)
        .send(fileData);
  
        console.log(res.body);
  
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('id').that.is.a('string');
      expect(res.body).to.have.property('userId', userId);
      expect(res.body).to.have.property('name', fileData.name);
      expect(res.body).to.have.property('type', fileData.type);
      expect(res.body).to.have.property('isPublic', false);
      expect(res.body).to.have.property('parentId', 0);
      fileId = res.body.id;
    });

    it('should return 401 for unauthorized (no token)', async () => {
      const res = await request(app).put(`/files/${fileId}/unpublish`);
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    it('should return 401 for unauthorized (no userId found)', async () => {
      const res = await request(app).put(`/files/${fileId}/unpublish`).set('x-token', 'notAToken');
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error', 'Unauthorized');
    });

    describe('GET /files/:id', () => {
      it('should retrieve the file by ID', async () => {
        const res = await request(app)
          .get(`/files/${fileId}`)
          .set('X-Token', token);
  
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('id', fileId);
        expect(res.body).to.have.property('userId', userId);
        expect(res.body).to.have.property('name', fileData.name);
        expect(res.body).to.have.property('type', fileData.type);
        expect(res.body).to.have.property('isPublic', false);
        expect(res.body).to.have.property('parentId', 0);
      });

      it('should return 401 for unauthorized (no token)', async () => {
        const res = await request(app).get('/files');
        expect(res.status).to.equal(401);
        expect(res.body).to.have.property('error', 'Unauthorized');
      });

      it('should return 401 for unauthorized (no userId found)', async () => {
        const res = await request(app).get('/files').set('x-token', 'NotAToken');
        expect(res.status).to.equal(401);
        expect(res.body).to.have.property('error', 'Unauthorized');
      });

      describe('GET /files', () => {
        it('should retrieve files with pagination', async () => {
          await request(app).post('/files').set('X-Token', token).send({
            name: 'file1.txt',
            type: 'file',
            data: Buffer.from('Content of file 1').toString('base64'),
          });

          await request(app).post('/files').set('X-Token', token).send({
            name: 'file2.txt',
            type: 'file',
            data: Buffer.from('Content of file 2').toString('base64'),
          });

          const res = await request(app).get('/files?page=1&limit=1').set('X-Token', token);
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('page', 1);
          expect(res.body).to.have.property('limit', 1);
          expect(res.body).to.have.property('totalFiles').that.is.above(1);
          expect(res.body).to.have.property('totalPages').that.is.a('number');
          expect(res.body.files).to.be.an('array').that.has.lengthOf(1);
        });

        it('should return 200 with an empty array if no files are found', async () => {
          const res = await request(app).get('/files?page=999&limit=10').set('X-Token', token);
          expect(res.status).to.equal(200);
          expect(res.body).to.have.property('files').that.is.an('array').that.is.empty;
          expect(res.body).to.have.property('totalFiles', 0);
          expect(res.body).to.have.property('totalPages', 0); 
        });

        describe('PUT /files/:id/publish', () => {
          it('should publish a file', async () => {
            const res = await request(app).put(`/files/${fileId}/publish`).set('x-token', token);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('userId', userId);
            expect(res.body).to.have.property('name', fileData.name);
            expect(res.body).to.have.property('type', fileData.type);
            expect(res.body).to.have.property('isPublic', true);
            expect(res.body).to.have.property('parentId', 0);
          });

          it('should return 401 for unauthorized (no token)', async() => {
            const res = await request(app).put(`/files/${fileId}/publish`);
            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('error', 'Unauthorized');
          });

          it('should return 404 for file not found', async () => {
            const res = await request(app).put('/files/123456123456/publish').set('x-token', token);
            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('error', 'Not found');
          });
        });
      });
    });

    after(async () => {
      await dbClient.client.db().collection('users').deleteOne({ email: userData.email });
  
      if (fileId) {
        await dbClient.client.db().collection('files').deleteOne({ _id: ObjectId(fileId) });
      }
  
      if (folderId) {
        await dbClient.client.db().collection('files').deleteOne({ _id: ObjectId(folderId) });
      }
  
      await redisClient.del(`auth_${token}`);
    });
  });
});
