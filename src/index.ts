import * as windows1251 from 'windows-1251';
import * as cheerio from 'cheerio';
import * as request from 'request-promise';
import * as requestS from 'request';
import * as icon from 'iconv-lite';

const extractLinksFromHTML = (html: string): Array<string> => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const listofA = $('a');
  const result = Object.values(listofA)
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
  const result = Object.values(listofA)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.href &&
        value.attribs.href.includes('//www.spr.kz/forum_vyvod.php?') &&
        !value.attribs.href.includes('#addcom'),
    )
    .map(value => value.attribs.href);

  return result;
};

const extractCommentsObject = (html: string) => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const h1 = $('#leftside > h1');
  const span = $('#leftside > span');
  const images = $('img');

  const signImage = Object.values(images)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.src &&
        value.attribs.src.includes('www.spr.kz/images/sign'),
    )
    .map(value => value.attribs.src)[0];
  const title = h1.text();
  const comment = span.text();
  const position =
    signImage === '//www.spr.kz/images/signbad.png' ? false : true;

  return { title, comment, position };
};

const encodedQuery = windows1251.encode('Альфа банк Алматы');
const testQuery = `https://www.spr.kz/res_new.php?findtext=${encodedQuery}&id_razdel_find=0&id_okrug_find=15`;

(async () => {
  const response = await request(testQuery);

  const links = extractLinksFromHTML(response);
  var commentsQuery = links[0].substr(2);

  const firstFinded = await request(`https://${commentsQuery}`);
  const commentsLink = extractCommentsLinks(firstFinded);

  const firstComment = commentsLink[0].substr(2);
  requestS(`https://${firstComment}`)
    .pipe(icon.decodeStream('win1251'))
    .pipe(icon.encodeStream('utf-8'))
    .collect((err, decodedBody) => {
      if (err) throw err;

      const comment = extractCommentsObject(decodedBody.toString());
    });
})();
