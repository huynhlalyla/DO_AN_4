import express from 'express';
import classController from '../controllers/classController.js';
import { verifyToken } from '../middlewares/auth.js';

const classRouter = express.Router();

// Routes
classRouter.get('/', verifyToken, classController.getAllClasses);
classRouter.get('/faculty/:facultyId', classController.getClassesByFaculty);
classRouter.get('/:id', classController.getClassById);
classRouter.post('/', verifyToken, classController.createClass);
classRouter.put('/:id', verifyToken, classController.updateClass);
classRouter.delete('/:id', verifyToken, classController.deleteClass);

export default classRouter;
