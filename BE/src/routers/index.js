import accountRouter from './account.js'
import error from '../routers/error.js';
const Router = (app) => {
    app.use('/account', accountRouter);




    // Xu ly loi
    app.use(error.notFound)

}






export default Router;