import * as express from 'express';
import * as requestPromise from 'request-promise';

// import Bizgid from './Bizgid';
import { collectComments } from './Spr';
import HTTPCodes from '../HTTPCode';

const RootRouter = express.Router();

const prepareComments = (source: string, comments: Object) => {
  const commentsArr = Object.keys(comments).map(key => comments[key]);

  return { source, feeds: commentsArr };
};

RootRouter.use('/comments', (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: 'Provide company name' });
    return;
  }

  collectComments(companyName, comments => {
    const readyComments = prepareComments('spr', comments);

    var options = {
      uri: 'http://feedtrap.tk/api/public/store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: JSON.stringify(readyComments),
    };
    requestPromise(options)
      .then(response => console.log(response))
      .catch(error => console.error('Error: ', error));
  });

  res.status(HTTPCodes.success).json({ message: 'Success' });
});

export default RootRouter;
