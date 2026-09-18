const mongoose = require("mongoose");

const connectDB = async () => {
    try {
await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.log("❌ MongoDB Connection Failed:");
        console.log(error.message);

        process.exit(1); // يوقف السيرفر إذا فشل الاتصال
    }
};

module.exports = connectDB;