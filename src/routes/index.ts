import * as express from "express";

import { collectComments as collectSprComments } from "./Spr";
import { collectComments as collectZhalobyComments } from "./Zhaloby";

import HTTPCodes from "../HTTPCode";
import { getTweets } from "../services/Twitter";

const RootRouter = express.Router();

const prepareComments = (comments: Object) => {
  const commentsArr = Object.keys(comments).map(key => comments[key]);

  return commentsArr;
};

const collectData = async (options: {
  companyName: string;
  collectFunction: any;
}) => {
  const { companyName, collectFunction } = options;
  try {
    const comments = await collectFunction(companyName);
    return new Promise((resolve, reject) => {
      try {
        if (!comments.subscribe) {
          resolve(prepareComments(comments));
          return;
        }
        comments.subscribe(comments => resolve(prepareComments(comments)));
      } catch (err) {
        reject(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

RootRouter.post("/twitter", async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: "Provide company name" });
    return;
  }

  try {
    const tweets = await collectData({
      collectFunction: getTweets,
      companyName
    });

    res.status(HTTPCodes.success).json(tweets);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

RootRouter.post("/spr", async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: "Provide company name" });
    return;
  }

  try {
    const comments = await collectData({
      collectFunction: collectSprComments,
      companyName
    });

    res.status(HTTPCodes.success).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

RootRouter.post("/zhaloby", async (req, res) => {
  const { companyName } = req.body;
  if (!companyName) {
    res.status(HTTPCodes.error).json({ message: "Provide company name" });
    return;
  }

  try {
    const comments = await collectData({
      collectFunction: collectZhalobyComments,
      companyName
    });

    res.status(HTTPCodes.success).json(comments);
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

export default RootRouter;
