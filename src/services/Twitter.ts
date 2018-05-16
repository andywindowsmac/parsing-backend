import * as Twit from "twit";
import * as cheerio from "cheerio";
import axios from "axios";

const T = new Twit({
  consumer_key: "nAOGsRYeQMBA77QbbKBEuiGPY",
  consumer_secret: "ovvrevhJGUwGnA6gmL1lmtstlBpBXay7Hc539Mg6ATz1GQLklw",
  access_token: "740941430462369792-bqyHqDv3DozDPkJAFjTlpGhOfGJsBTF",
  access_token_secret: "1shmXfKIJcN2RwY5wV727rAk6s6Z7xD78UVQA9hEBD0C3",
  timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
});

const getTweets = (searchQuery: string) =>
  new Promise((resolve, reject) =>
    T.get(
      "search/tweets",
      { q: encodeURIComponent(searchQuery), count: 100 },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const tweets = prepareTweets(data.statuses);

        resolve(tweets);
      }
    )
  );

export interface TweetType {
  text: string;
  created_at: string;
  user: { name: string };
  favorite_count: number;
  retweet_count: number;
  [key: string]: any;
}

const extractFullText = (html: string) => {
  const $ = cheerio.load(html);
  const text = $("div.js-tweet-text-container").text();
  return text;
};

const getFullText = async (link: string) => {
  try {
    const { data } = await axios.get(link);
    return extractFullText(data);
  } catch (err) {
    return null;
  }
};

const prepareTweets = (tweets: Array<TweetType> | any) =>
  Promise.all(
    tweets.map(async tweet => {
      const {
        text,
        created_at,
        user: { name },
        favorite_count,
        retweet_count
      } = tweet;

      const date = new Date(created_at).getTime() / 1000;
      const extractedLink = text.split("…")[1];
      let fullText = "";
      if (extractedLink) {
        const fText = await getFullText(extractedLink);
        fullText = fText.replace(/\t/g, "").replace(/\n/g, "");
      }

      return {
        text: fullText || text,
        date,
        name,
        likes: favorite_count,
        reposts: retweet_count,
        link: extractedLink || null
      };
    })
  );

export { getTweets, prepareTweets };
