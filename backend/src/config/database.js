import mongoose, { connect } from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async() => {
    try {

        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 5000,
        })
        
    } catch (err) {
        logger.error("MongoDB connection failed", err);
        process.exit(1);
    }
};

//Health check

const checkDB = async () => {
    const state = mongoose.connect.readyState;
    return state === 1;
};

module.exports = { connectDB, checkDB };