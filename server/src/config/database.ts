import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.warn('MONGODB_URI not set. Running without database (in-memory only).');
            return;
        }

        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');
    } catch (error) {
        console.error('✗ MongoDB connection error:', error);
        console.warn('Continuing without database...');
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
    } catch (error) {
        console.error('✗ Error disconnecting from MongoDB:', error);
    }
};
