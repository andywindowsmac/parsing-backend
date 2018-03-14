import * as express from 'express';

import Bizgid from './Bizgid';

const RootRouter = express.Router();

RootRouter.use('/bizgid', Bizgid);

export default RootRouter;
