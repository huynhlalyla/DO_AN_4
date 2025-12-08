import express from 'express';
import {
    getAllAdmins,
    getAdminById,
    getAdminsByLevel,
    getAdminsByFaculty,
    createAdmin,
    updateAdmin,
    deleteAdmin
} from '../controllers/adminController.js';

const router = express.Router();

// Admin CRUD
router.get('/', getAllAdmins);
router.get('/level/:level', getAdminsByLevel);
router.get('/faculty/:facultyId', getAdminsByFaculty);
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;
