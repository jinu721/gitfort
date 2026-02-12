import mongoose from 'mongoose';
import { MONGODB_URI } from './env';

interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

class MongoDBConnection implements DatabaseConnection {
  private static instance: MongoDBConnection;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<void> {
    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        bufferMaxEntries: 0
      });
    } catch (error) {
      this.connectionPromise = null;
      throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected()) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.connectionPromise = null;
    } catch (error) {
      throw new Error(`Failed to disconnect from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export const database = MongoDBConnection.getInstance();
export { DatabaseConnection };