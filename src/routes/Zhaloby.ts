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
  const date = details[3].attribs.showdata.split('Дата публикации: ')[1];
  let convertedDate;

  if (!date.includes('Вчера') && !date.includes('Сегодня')) {
    const splittedDate = date.split(', ')[0].replace(/\-/g, ':');
    convertedDate = new Date(splittedDate).getTime() / 1000;
  }
  if (date.includes('Вчера')) {
    const generalDate = new Date();
    convertedDate = parseInt(
      String(generalDate.setDate(generalDate.getDate() - 1) / 1000),
    );
  }

  if (date.includes('Сегодня')) {
    convertedDate = parseInt(String(new Date().getTime() / 1000));
  }
  return {
    name: authorNick,
    text: `${title}: ${comment}`,
    date: convertedDate,
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
