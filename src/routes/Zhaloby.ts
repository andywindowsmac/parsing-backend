import * as Rx from 'rxjs';
import * as cheerio from 'cheerio';
import * as requestPromise from 'request-promise';
import { _throw } from 'rxjs/observable/throw';

const extractLinks = (html: string) => {
  const $ = cheerio.load(html);
  const linksHtml = $('div[class="read_bt"] > a');
  return linksHtml.map(index => linksHtml[index].attribs.href);
};

const extractCommentObject = (html: string) => {
  const $ = cheerio.load(html);
  const div = $('div[itemtype="http://schema.org/Review"]');

  const titleChildrens = div.children()[0];
  const comment = $(div.children()[1]).text();
  const details = div.children()[3].children;

  const title = $(
    titleChildrens.children[titleChildrens.children.length - 1],
  ).text();

  const authorNick = $(details[1].children[1]).text();
  const date = details[3].attribs.showdata;
  const source = {
    name: 'Zhaloby',
    website: 'zhalobi.kz',
  };

  const author = {
    name: authorNick,
    gender: null,
    age: null,
  };

  return {
    source,
    author,
    likes: null,
    dislikes: null,
    text: `${title}: ${comment}`,
    position: false,
    date: date,
    views: null,
  };
};

const observableCommentRequest = (link: string) => {
  const promise = requestPromise(link)
    .then(comment => extractCommentObject(comment))
    .catch(err => _throw(err));

  return Rx.Observable.fromPromise(promise);
};

const collectComments = async (companyName: string) => {
  const query = `https://zhalobi.kz/`;

  const formData = {
    do: 'search',
    subaction: 'search',
    story: companyName,
  };

  var options = {
    uri: query,
    method: 'POST',
    body: JSON.stringify(formData),
  };

  const promise = requestPromise(options)
    .then(comment => comment)
    .catch(err => _throw(err));

  return Rx.Observable.fromPromise(promise)
    .flatMap((html: string) => extractLinks(html))
    .flatMap((commentLink: string) => observableCommentRequest(commentLink))
    .map((comment, index) => ({ [index]: comment }))
    .reduce((acc, comment) => ({ ...acc, ...comment }));
};

export { collectComments };
