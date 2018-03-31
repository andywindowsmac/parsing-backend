import * as Rx from 'rxjs';
import * as windows1251 from 'windows-1251';
import * as cheerio from 'cheerio';
import * as requestPromise from 'request-promise';
import * as requestS from 'request';
import * as icon from 'iconv-lite';
import { _throw } from 'rxjs/observable/throw';
import { removeDuplicateFromArray } from '../utils/Scrapper';

const extractLinksFromHTML = (html: string): Array<string> => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const listofA = $('a');
  const result = (<any>Object)
    .values(listofA)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.href &&
        value.attribs.href.includes('//www.spr.kz/otzyvy/') &&
        value.attribs.href.localeCompare('//www.spr.kz/otzyvy/') !== 0,
    )
    .map(value => value.attribs.href);

  return result;
};

const extractCommentsLinks = (html: string) => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const listofA = $('a');
  const result = (<any>Object)
    .values(listofA)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.href &&
        value.attribs.href.includes('//www.spr.kz/forum_vyvod.php?') &&
        !value.attribs.href.includes('#addcom'),
    )
    .map(value => value.attribs.href);

  return removeDuplicateFromArray(result);
};

const extractCommentObject = (html: string) => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const span = $('#leftside > span');
  const authorName = $('#leftside > span[style="font-weight:bold;"]').text();
  const commentsDate = $('#leftside').find('span');
  const images = $('img');

  const signImage = (<any>Object)
    .values(images)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.src &&
        value.attribs.src.includes('www.spr.kz/images/sign'),
    )
    .map(value => value.attribs.src)[0];
  const comment = span.text();
  const commentDate = $(commentsDate[1]).text();
  const views = $(commentsDate[2]).text();
  const position =
    signImage === '//www.spr.kz/images/signbad.png' ? false : true;
  const source = {
    name: 'Spr',
    website: 'www.spr.kz',
  };

  const author = {
    name: authorName,
    gender: null,
    age: null,
  };

  return {
    source,
    author,
    likes: null,
    dislikes: null,
    text: comment,
    position,
    date: commentDate,
    views,
  };
};

const convertToPromise = (url: string): Promise<Object> => {
  return new Promise((resolve, reject) => {
    requestS(url)
      .pipe(icon.decodeStream('win1251'))
      .pipe(icon.encodeStream('utf-8'))
      .collect((err, decodedBody) => {
        if (err) reject(err);

        const comment = extractCommentObject(decodedBody.toString());
        resolve(comment);
      });
  });
};

const observableRequest = (link: string) => {
  const promise = convertToPromise(link)
    .then(comment => comment)
    .catch(err => _throw(err));

  return Rx.Observable.fromPromise(promise);
};

const collectComments = async (companyName: string) => {
  const encodedQuery = windows1251.encode(companyName);
  const query = `https://www.spr.kz/res_new.php?findtext=${encodedQuery}&id_razdel_find=0&id_okrug_find=15`;

  const response = await requestPromise(query);
  const links = extractLinksFromHTML(response);
  var commentsQuery = links[0].substr(2);

  const firstFinded = await requestPromise(`https://${commentsQuery}`);
  const commentsLink = extractCommentsLinks(firstFinded);

  return Rx.Observable.from(commentsLink)
    .flatMap((commentLink: string) => {
      var commentsQuery = commentLink.substr(2);
      return observableRequest(`https://${commentsQuery}`);
    })
    .map((comment, index) => ({ [index]: comment }))
    .reduce((acc, comment) => ({ ...acc, ...comment }));
};

export { collectComments };
