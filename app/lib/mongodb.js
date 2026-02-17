import mongoose from "mongoose";

const mongo = process.env.MONDODB_URI;

if (!mongo){
    throw new Error('Please define MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached){
    cached = global.mongoose = { conn: null, promise: null};
}

async function connectDB(){
    if (cached.conn){
        return cached.conn;
    }

    if (!cached.promise){
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(mongo, opts).then((mongoose) => {
        return mongoose;
    });
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