import * as Rx from "rxjs";
import * as windows1251 from "windows-1251";
import * as cheerio from "cheerio";
import * as requestPromise from "request-promise";
import axios from "axios";
import * as requestS from "request";
import * as icon from "iconv-lite";
import { removeDuplicateFromArray } from "../utils/Scrapper";

const extractLinksFromHTML = (html: string): Array<string> => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const listofA = $("a");
  const result = (<any>Object)
    .values(listofA)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.href &&
        value.attribs.href.includes("//www.spr.kz/otzyvy/") &&
        value.attribs.href.localeCompare("//www.spr.kz/otzyvy/") !== 0
    )
    .map(value => value.attribs.href);

  return result;
};

const extractCommentsLinks = (html: string) => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const listofA = $("a");
  const result = (<any>Object)
    .values(listofA)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.href &&
        value.attribs.href.includes("//www.spr.kz/forum_vyvod.php?") &&
        !value.attribs.href.includes("#addcom")
    )
    .map(value => value.attribs.href);

  return removeDuplicateFromArray(result);
};

const extractCommentObject = (html: string) => {
  const $ = cheerio.load(html, { decodeEntities: true });
  const span = $("#leftside > span");
  const authorName = $('#leftside > span[style="font-weight:bold;"]').text();
  const commentsDate = $("#leftside").find("span");
  const images = $("img");

  const signImage = (<any>Object)
    .values(images)
    .filter(
      value =>
        value &&
        value.attribs &&
        value.attribs.src &&
        value.attribs.src.includes("www.spr.kz/images/sign")
    )
    .map(value => value.attribs.src)[0];
  const comment = span.text();
  const commentDate = parseInt(
    String(new Date($(commentsDate[1]).text()).getTime() / 1000)
  );
  const views = parseInt($(commentsDate[2]).text());
  const position =
    signImage === "//www.spr.kz/images/signbad.png" ? false : true;

  return {
    name: authorName,
    text: comment,
    position,
    date: commentDate,
    views
  };
};

const convertToPromise = (url: string): Promise<Object> => {
  return new Promise((resolve, reject) => {
    requestS(url, res => {
      if (!res) {
        reject(url);
      }
    })
      .pipe(icon.decodeStream("win1251"))
      .pipe(icon.encodeStream("utf-8"))
      .collect((err, decodedBody) => {
        if (err) {
          console.log("Collect err: ", err);
          reject(url);
        }

        const comment = extractCommentObject(decodedBody.toString());
        resolve(comment);
      })
      .on("error", err => {
        console.log("err: ", err);
        reject(url);
      });
  });
};

const observableRequest = (link: string) => {
  const promise = convertToPromise(link)
    .then(comment => comment)
    .catch(err => {
      console.log("Request err: ", err);
      throw new Error(err);
    });

  return Rx.Observable.fromPromise(promise);
};

const collectComments = async (companyName: string) => {
  try {
    const encodedQuery = windows1251.encode(companyName);
    const query = `https://www.spr.kz/res_new.php?findtext=${encodedQuery}&id_razdel_find=0&id_okrug_find=15`;

    const { data: response } = await axios.get(query);
    const links = extractLinksFromHTML(response);

    let index = 1;

    if (links.length === 0) {
      return [];
    }

    const commentRequestStream = observable =>
      observable
        .flatMap((html: string) => {
          const commentsLinks = extractCommentsLinks(html);
          return commentsLinks;
        })
        .flatMap((commentLink: string) => {
          var commentsQuery = commentLink.substr(2);
          console.log(commentsQuery);
          return observableRequest(`https://${commentsQuery}`);
        })
        .catch(error => console.log("Catched: ", error))
        .map(comment => ({ [index++]: comment }))
        .reduce((acc, comment) => ({ ...acc, ...comment }));

    return new Promise(resolve =>
      Rx.Observable.from(links)
        .flatMap((link: string) => {
          const commentsQuery = link.substr(2);
          console.log(commentsQuery);
          return Rx.Observable.from(
            commentRequestStream(
              Rx.Observable.fromPromise(
                requestPromise(`https://${commentsQuery}`)
              )
            )
          );
        })
        .reduce((_s, acc) => ({ ...acc, ..._s }))
        .subscribe(
          comments =>
            console.log(Object.keys(comments).length) || resolve(comments)
        )
    );
  } catch (err) {
    console.log("Spr error: ", err);
  }
};

export { collectComments };
