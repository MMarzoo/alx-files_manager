import { MongoClient } from 'mongodb';

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '27017';
const DATABASE = process.env.DB_DATABASE || 'files_manager';
const URI = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    this.connected = false;
    this.db = null;
    // Attempt to connect to MongoDB
    this.client = new MongoClient(URI, { useUnifiedTopology: true });
    this.client
      .connect()
      .then(() => {
        this.connected = true;
        this.db = this.client.db(DATABASE);
        console.log('Connected to the database');
      })
      .catch((err) => {
        console.error('Error connecting to the database:', err);
      });
  }

  isAlive() {
    // Return false if there was an error connecting
    return this.connected && this.db !== null;
  }

  async nbUsers() {
    if (!this.isAlive()) return 0;
    try {
      return await this.db.collection('users').countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
      return 0;
    }
  }

  async nbFiles() {
    if (!this.isAlive()) return 0;
    try {
      return await this.db.collection('files').countDocuments();
    } catch (err) {
      console.error('Error counting files:', err);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
