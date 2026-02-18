import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Skip database connection during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('📦 Build mode detected - skipping database connection');
    return null;
  }

  const mongo = process.env.MONGODB_URI;

  if (!mongo) {
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