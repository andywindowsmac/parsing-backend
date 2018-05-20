// import { collectComments as collectSprComments } from "./Spr";
import { collectComments as collectZhalobyComments } from "./Zhaloby";

import { getTweets } from "../services/Twitter";

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

const getFromTwitter = async companyName => {
  if (!companyName) {
    throw new Error("Provide company name");
  }
  const tweets = await collectData({
    collectFunction: getTweets,
    companyName
  });

  return tweets;
};

// const getFromSpr = async companyName => {
//   if (!companyName) {
//     throw new Error("Provide company name");
//   }

//   const comments = await collectData({
//     collectFunction: collectSprComments,
//     companyName
//   });

//   return comments;
// };

const getFromZhaloby = async companyName => {
  if (!companyName) {
    throw new Error("Provide company name");
  }

  const comments = await collectData({
    collectFunction: collectZhalobyComments,
    companyName
  });

  return comments;
};

const webSocketConnectionListener = wss =>
  wss.on("connection", (ws: any) => {
    //connection is up, let's add a simple simple event
    ws.on("message", async (companyName: string) => {
      //log the received message and send it back to the client
      try {
        const zhaloby = async () => {
          const comments = await getFromZhaloby(companyName);
          ws.send(JSON.stringify({ zhaloby: comments }));
        };

        // const spr = async () => {
        //   const comments = await getFromSpr(companyName);
        //   ws.send(JSON.stringify({ spr: comments }));
        // };

        const twitter = async () => {
          const comments = await getFromTwitter(companyName);
          ws.send(JSON.stringify({ twitter: comments }));
        };

        zhaloby();
        // spr();
        twitter();
      } catch (err) {
        console.log("Error root: ", err);
        ws.send(JSON.stringify({ error: "Error" }));
      }
    });

    //send immediatly a feedback to the incoming connection
    ws.send(JSON.stringify({ message: "Connection established" }));
  });

export default webSocketConnectionListener;
