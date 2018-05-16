import * as _ from "lodash";
import { _throw } from "rxjs/observable/throw";
import * as cheerio from "cheerio";
import * as requestPromise from "request-promise";
import * as Rx from "rxjs";

const extractNavigation = (html: string) => {
  const $ = cheerio.load(html);
  const linksHtml = $("div.navigation > a");
  return linksHtml.length + 1;
};

const extractLinks = (html: string) => {
  const $ = cheerio.load(html);
  const linksHtml = $("div.read_bt > a");

  return linksHtml.map(index => linksHtml[index].attribs.href);
};

const extractCommentObject = (html: string) => {
  const $ = cheerio.load(html);
  const div = $('div[itemtype="http://schema.org/Review"]');

  const comment = $(div.children()[1]).text();
  const details = div.children()[3].children;

  const authorNick = $(details[1].children[1]).text();
  const date = details[3].attribs.showdata.split("Дата публикации: ")[1];
  let convertedDate;

  if (!date.includes("Вчера") && !date.includes("Сегодня")) {
    const splittedDate = date.split(", ")[0].replace(/\-/g, ":");
    convertedDate = new Date(splittedDate).getTime() / 1000;
  }
  if (date.includes("Вчера")) {
    const generalDate = new Date();
    convertedDate = parseInt(
      String(generalDate.setDate(generalDate.getDate() - 1) / 1000)
    );
  }

  if (date.includes("Сегодня")) {
    convertedDate = parseInt(String(new Date().getTime() / 1000));
  }

  const commentWithRemovedCharacters = comment
    .replace(/\t/g, "")
    .replace(/\n/g, "")
    .replace("               ", "");

  return {
    name: authorNick,
    text: commentWithRemovedCharacters,
    date: convertedDate
  };
};

const observableCommentRequest = (link: string) => {
  const promise = requestPromise(link)
    .then(comment => extractCommentObject(comment))
    .catch(err => _throw(err));

  return Rx.Observable.fromPromise(promise);
};

const collectComments = async (companyName: string) => {
  const pageQuery = "https://zhalobi.kz/index.php?do=search";

  const pageOptions = (pageNumber, resultNumber) => ({
    method: "POST",
    uri: pageQuery,
    form: {
      do: "search",
      subaction: "search",
      story: companyName,
      search_start: pageNumber,
      full_search: 0,
      result_from: resultNumber
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  let pageCount;
  let comments = {};
  let index = 1;

  /* Extract comment stream */
  const commentRequestStream = (
    observable: Rx.Observable<string>
  ): Rx.Observable<{
    [x: number]: any;
  }> =>
    observable
      .flatMap((html: string) => {
        /* extract extract comments link */
        return extractLinks(html);
      })
      .flatMap((commentLink: string) =>
        /* request comments link */
        observableCommentRequest(commentLink)
      )
      /* save comment with index as key  */
      .map(comment => ({ [index++]: comment }))
      /* gather all comments into one object */
      .reduce((acc, comment) => ({ ...acc, ...comment }));

  const firstPromise = requestPromise(pageOptions(1, 1));

  const firstRequestObservable = Rx.Observable.fromPromise(firstPromise).map(
    (html: string) => {
      pageCount = extractNavigation(html);
      return html;
    }
  );

  const firstCommentsStream = commentRequestStream(firstRequestObservable);

  return new Promise(resolve => {
    firstCommentsStream
      .flatMap(firstComments => {
        comments = { ...comments, ...firstComments };
        if (pageCount === 1) {
          resolve(comments);
          return Rx.Observable.empty();
        }
        return _.range(pageCount - 1);
      })
      .concatMap((value: number) =>
        Rx.Observable.from(
          commentRequestStream(
            Rx.Observable.fromPromise(
              requestPromise(
                pageOptions(value + 2, Object.keys(comments).length + 1)
              )
            )
          )
        )
      )
      .map(newComments => {
        comments = { ...comments, ...newComments };
        return comments;
      })
      .reduce((_s, acc) => acc)
      .subscribe(comments => resolve(comments));
  });
};

export { collectComments };
