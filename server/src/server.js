import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import Router from './routers/index.js';
import { startReminderJob } from './cron/reminderJob.js';

// Load environment variables
dotenv.config();

// ================ Khởi tạo app ================//
const app = express();
const PORT = process.env.PORT || 3000;

// ================= Phan mem trung gian ========//
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ================== Dinh tuyen ================//
Router(app);

// ==================== Chay server =============//
const startServer = async () => {
    try {
        // Kết nối database
        await connectDB();
        
        // Start reminder job
        startReminderJob();

        // Start server
        app.listen(PORT, () => {
            console.clear();
            console.log(`
        ======================================
        || ✅ Server is running 
        || Visit: http://localhost:${PORT}
        || Environment: ${process.env.NODE_ENV || 'development'}
        ======================================
            `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();