import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

async function clearDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shashi-hrm';
    await mongoose.connect(mongoURI);
    logger.info('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.collections();

    // Clear each collection
    for (const collection of collections) {
      await collection.deleteMany({});
      logger.info(`Cleared collection: ${collection.collectionName}`);
    }

    logger.info('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase(); 