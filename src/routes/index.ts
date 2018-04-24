import * as express from 'express';

import { collectComments as collectSprComments } from './Spr';
import { collectComments as collectZhalobyComments } from './Zhaloby';

import HTTPCodes from '../HTTPCode';
import { getTweets } from '../services/Twitter';

const RootRouter = express.Router();

const prepareComments = (source: string, comments: Object) => {
  const commentsArr = Object.keys(comments).map(key => comments[key]);

  return { [source]: commentsArr };
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
        if (!comments.subscribe) {
          resolve(prepareComments(source, comments));
          return;
        }
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

// RootRouter.post('/comments', async (req, res) => {
//   const { companyName } = req.body;
//   if (!companyName) {
//     res.status(HTTPCodes.error).json({ message: 'Provide company name' });
//     return;
//   }

//   try {
//     const results = await Promise.all(
//       sources.map(
//         async source => await collectData({ ...source, companyName }),
//       ),
//     );

//     const companyComments = {
//       name: companyName,
//       address: null,
//       phone: null,
//       website: null,
//       from: null,
//     };
//     const comments = results.reduce((r, acc) => ({ ...acc, ...r }));

//     const responseResult = { ...companyComments, ...comments };

//     res.status(HTTPCodes.success).json({ result: responseResult });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed' });
//   }
// });

RootRouter.post('/twitter', async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: 'Provide company name' });
    return;
  }

  try {
    const tweets = await collectData({
      source: 'twitter',
      collectFunction: getTweets,
      companyName,
    });

    const companyComments = {
      name: companyName,
      address: null,
      phone: null,
      website: null,
      from: null,
      ...tweets,
    };

    res.status(HTTPCodes.success).json({ result: companyComments });
  } catch (err) {
    res.status(500).json({ message: 'Failed' });
  }
});

RootRouter.post('/spr', async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: 'Provide company name' });
    return;
  }

  try {
    const comments = await collectData({
      source: 'spr',
      collectFunction: collectSprComments,
      companyName,
    });

    const companyComments = {
      name: companyName,
      address: null,
      phone: null,
      website: null,
      from: null,
      ...comments,
    };

    res.status(HTTPCodes.success).json({ result: companyComments });
  } catch (err) {
    res.status(500).json({ message: 'Failed' });
  }
});

RootRouter.post('/zhaloby', async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: 'Provide company name' });
    return;
  }

  try {
    const comments = await collectData({
      source: 'zhaloby',
      collectFunction: collectZhalobyComments,
      companyName,
    });

    const companyComments = {
      name: companyName,
      address: null,
      phone: null,
      website: null,
      from: null,
      ...comments,
    };

    res.status(HTTPCodes.success).json({ result: companyComments });
  } catch (err) {
    res.status(500).json({ message: 'Failed' });
  }
});

export default RootRouter;
