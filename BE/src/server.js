import express from 'express';
import cors from 'cors';
import Router from './routers/index.js';


// ================ Khởi tạo app ================//
const app = express();
const PORT = 3000;

// ================= Phan mem trung gian ========//
app.use(cors());
app.use(express.json());

// ================== Dinh tuyen ================//
Router(app);

// ==================== Chay server =============//
app.listen(PORT, () => {
    console.clear()
    console.log(`
        ======================================
        || ✅ Server is running 
        || Visit: http://localhost:${PORT}
        ======================================
    `)
})