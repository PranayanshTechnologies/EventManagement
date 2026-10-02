const mongoose = require("mongoose");
const dns = require("dns");

// Fix for ECONNREFUSED on MongoDB SRV DNS lookup
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.warn("⚠️ Warning: MONGODB_URI is not defined in environment variables.");
            return;
        }

        const connection = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout to avoid hanging indefinitely
        });

        console.log(`✅ MongoDB Connected successfully: ${connection.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        console.warn("⚠️ Continuing server execution. MongoDB will retry or can be connected once Atlas network access/whitelist is configured.");
        // Do not process.exit(1) so development server stays running
    }
};

module.exports = connectDB;