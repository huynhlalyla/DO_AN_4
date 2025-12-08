import express from 'express';
import classController from '../controllers/classController.js';

const classRouter = express.Router();

// Routes
classRouter.get('/', classController.getAllClasses);
classRouter.get('/faculty/:facultyId', classController.getClassesByFaculty);
classRouter.get('/:id', classController.getClassById);
classRouter.post('/', classController.createClass);
classRouter.put('/:id', classController.updateClass);
classRouter.delete('/:id', classController.deleteClass);

export default classRouter;
