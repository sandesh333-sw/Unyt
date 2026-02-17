import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const mongo = process.env.MONGODB_URI;

  // During build time, env vars might not be available
  // Only throw at runtime when actually trying to connect
  if (!mongo) {
    // Check if we're in build mode
    if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not set - database calls will fail at runtime');
      // Return a mock connection object to allow build to continue
      return null;
    }
    throw new Error("Please define MONGODB_URI environment variable");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(mongo, opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;