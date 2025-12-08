import express from 'express';
import {
    getAllCriteria,
    getCriteriaByCategory,
    getCriteriaById,
    createCriteria,
    updateCriteria,
    deleteCriteria
} from '../controllers/criteriaController.js';

const router = express.Router();

router.get('/', getAllCriteria);
router.get('/category/:categoryId', getCriteriaByCategory);
router.get('/:id', getCriteriaById);
router.post('/', createCriteria);
router.put('/:id', updateCriteria);
router.delete('/:id', deleteCriteria);

export default router;
