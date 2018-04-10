import * as express from 'express';
import * as requestPromise from 'request-promise';

import { collectComments as collectSprComments } from './Spr';
import { collectComments as collectZhalobyComments } from './Zhaloby';

import HTTPCodes from '../HTTPCode';

const RootRouter = express.Router();

const prepareComments = (source: string, comments: Object) => {
  const commentsArr = Object.keys(comments).map(key => comments[key]);
  const maxChunk = 5000;

  if (commentsArr.length > maxChunk) {
    const splittedArray = [];

    for (let i = 0; i <= maxChunk; i += maxChunk) {
      splittedArray.push({
        source,
        feeds: commentsArr.splice(i, i + maxChunk),
      });
    }
    return { splittedArray };
  }

  return { [source]: commentsArr };
};

const sendComments = comments => {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const uri = 'http://feedtrap.tk/api/public/store';
  const method = 'POST';

  if (comments.splittedArray) {
    const splittedOptions = comments.splittedArray.map(s => ({
      uri,
      headers,
      method,
      body: JSON.stringify(s),
    }));

    splittedOptions.map(o => requestPromise(o));
    return;
  }

  const options = {
    uri,
    headers,
    method,
    body: JSON.stringify(comments),
  };

  requestPromise(options).catch(error => console.error('Error: ', error));
};

const collectData = async (options: {
  source: string;
  companyName: string;
  collectFunction: any;
}) => {
  const { companyName, collectFunction, source } = options;
  try {
    const comments = await collectFunction(companyName);
    return new Promise((resolve, reject) => {
      try {
        comments.subscribe(comments =>
          resolve(prepareComments(source, comments)),
        );
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

RootRouter.use('/comments', async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: 'Provide company name' });
    return;
  }

  const zhaloby = await collectData({
    companyName,
    source: 'zhaloby',
    collectFunction: collectZhalobyComments,
  });
  const spr = await collectData({
    companyName,
    source: 'spr',
    collectFunction: collectSprComments,
  });

  sendComments({ ...spr, ...zhaloby });
  res.status(HTTPCodes.success).json({ message: 'Success' });
});

export default RootRouter;
