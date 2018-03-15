import * as windows1251 from 'windows-1251';
import * as cheerio from 'cheerio';
import * as request from 'request-promise';

const string2Bin = str => {
  var result = [];
  for (var i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i).toString(2));
  }
  return result;
};

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

const extractComments = (html: string) => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const td = $('td.valign').text('top');

  var text = td
    .contents()
    .map(function() {
      if (this.type === 'text')
        return $(this)
          .text()
          .trim();
    })
    .get();
  console.log(td);
  return null;
};

const encodedQuery = windows1251.encode('Альфа банк Алматы');

const testQuery = `https://www.spr.kz/res_new.php?findtext=${encodedQuery}&id_razdel_find=0&id_okrug_find=15`;

(async () => {
  const response = await request(testQuery);

  const links = extractLinksFromHTML(response);
  var commentsQuery = links[0].substr(2);
  const firstFinded = await request(`https://${commentsQuery}`);
  const comments = extractComments(firstFinded);
})();
