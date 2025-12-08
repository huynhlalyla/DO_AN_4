import express from 'express';
const accountRouter = express.Router();
import accountController from '../controllers/accountController.js';

// tao user moi
accountRouter.post('/create', accountController.createUser);
accountRouter.get('/', accountController.getAll);
accountRouter.delete('/delete/:id', accountController.deleteUser);


export default accountRouter;