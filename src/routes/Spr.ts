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
  const position =
    signImage === '//www.spr.kz/images/signbad.png' ? false : true;

  return { source: 'www.spr.kz', text: comment, position };
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

const collectComments = async (companyName: string, callback: Function) => {
  const encodedQuery = windows1251.encode(companyName);
  const query = `https://www.spr.kz/res_new.php?findtext=${encodedQuery}&id_razdel_find=0&id_okrug_find=15`;

  const response = await requestPromise(query);
  const links = extractLinksFromHTML(response);
  var commentsQuery = links[0].substr(2);

  const firstFinded = await requestPromise(`https://${commentsQuery}`);
  const commentsLink = extractCommentsLinks(firstFinded);

  Rx.Observable.from(commentsLink)
    .flatMap((commentLink: string) => {
      var commentsQuery = commentLink.substr(2);
      return observableRequest(`https://${commentsQuery}`);
    })
    .map((comment, index) => ({ [index]: comment }))
    .reduce((acc, comment) => ({ ...acc, ...comment }))
    .subscribe(comments => callback(comments));
};

export { collectComments };

// TODO: rewrite to observable

// const requestStream = Rx.Observable.of(query)
//     .flatMap((pageUrl: string) =>
//       Rx.Observable.fromPromise(requestPromise(pageUrl)),
//     )
//     .flatMap((commentsPage: string) => extractLinksFromHTML(commentsPage))
//     .flatMap((commentsPageLink: string) => {
//       const requestLink = commentsPageLink.substr(2);
//       return Rx.Observable.fromPromise(
//         requestPromise(`https://${requestLink}`),
//       );
//     })
//     .flatMap((commentsLink: string) => extractCommentsLinks(commentsLink))
//     .flatMap((commentLink: string) => {
//       const commentRequest = commentLink.substr(2);
//       return observableRequest(`https://${commentRequest}`);
//     })
//     .subscribe(comments => console.log(comments));
