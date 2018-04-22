import * as Twit from 'twit';

const T = new Twit({
  consumer_key: 'nAOGsRYeQMBA77QbbKBEuiGPY',
  consumer_secret: 'ovvrevhJGUwGnA6gmL1lmtstlBpBXay7Hc539Mg6ATz1GQLklw',
  access_token: '740941430462369792-bqyHqDv3DozDPkJAFjTlpGhOfGJsBTF',
  access_token_secret: '1shmXfKIJcN2RwY5wV727rAk6s6Z7xD78UVQA9hEBD0C3',
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
});

const getTweets = (searchQuery: string) =>
  new Promise((resolve, reject) =>
    T.get(
      'search/tweets',
      { q: encodeURIComponent(searchQuery), count: 100 },
      (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const tweets = prepareTweets(data.statuses);

        resolve(tweets);
      },
    ),
  );

export interface TweetType {
  text: string;
  created_at: string;
  user: { name: string };
  favorite_count: number;
  retweet_count: number;
  [key: string]: any;
}

const prepareTweets = (tweets: Array<TweetType> | any) =>
  tweets.map(tweet => {
    const {
      text,
      created_at,
      user: { name },
      favorite_count,
      retweet_count,
    } = tweet;

    const date = new Date(created_at).getTime() / 1000;

    return {
      text,
      date,
      name,
      likes: favorite_count,
      reposts: retweet_count,
    };
  });

export { getTweets, prepareTweets };
