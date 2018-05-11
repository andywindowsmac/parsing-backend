import * as express from "express";

import { collectComments as collectSprComments } from "./Spr";
import { collectComments as collectZhalobyComments } from "./Zhaloby";

import HTTPCodes from "../HTTPCode";
import { getTweets } from "../services/Twitter";

const RootRouter = express.Router();

const prepareComments = (source: string, comments: Object) => {
  const commentsArr = Object.keys(comments).map(key => comments[key]);

  return commentsArr;
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
          resolve(prepareComments(source, comments))
        );
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
      source: "twitter",
      collectFunction: getTweets,
      companyName
    });

    const companyComments = {
      ...tweets
    };

    res.status(HTTPCodes.success).json({ result: companyComments });
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
      source: "spr",
      collectFunction: collectSprComments,
      companyName
    });

    const companyComments = {
      ...comments
    };

    res.status(HTTPCodes.success).json({ result: companyComments });
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
      source: "zhaloby",
      collectFunction: collectZhalobyComments,
      companyName
    });

    const companyComments = {
      ...comments
    };

    res.status(HTTPCodes.success).json({ result: companyComments });
  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
});

export default RootRouter;
