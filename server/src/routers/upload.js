import express from 'express';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Return the file path (relative to server root, accessible via /uploads/...)
        // Note: uploadDir is 'uploads/events', so we need to include 'events' in the URL
        const fileUrl = `/uploads/events/${req.file.filename}`;
        
        res.status(200).json({
            success: true,
            data: {
                url: fileUrl,
                fileName: req.file.originalname
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
