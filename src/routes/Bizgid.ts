import * as express from 'express';
import * as Rx from 'rxjs';
import * as httpRequest from 'request-promise';

import HTTPCodes from '../HTTPCode';
import { Hosts, Blacklist } from '../config';
import { extractLinksFromHTML, removeForwardSlash } from '../utils/Scrapper';

const BizgidRoute: express.Router = express.Router();

let { bigzid: blacklist } = Blacklist;

const getLinks = (
  requestUrl: string,
  params?: { hostlink: string; isAddHostLink: boolean },
) => {
  const url =
    params && params.isAddHostLink
      ? `${params.hostlink}${requestUrl}`
      : requestUrl;
  const promise = httpRequest(url)
    .then(htmlString => {
      const links = extractLinksFromHTML({ html: htmlString, blacklist });
      if (params) {
        const nLinks = links.map(link => ({ link, host: params.hostlink }));
        console.log(requestUrl, params);
        return nLinks;
      }

      return links;
    })
    .catch(err => err);

  return Rx.Observable.fromPromise(promise);
};

const pageRequest = new Rx.Subject();

pageRequest
  // get cities
  .flatMap((pageUrl: string) => getLinks(pageUrl))
  .flatMap((cities: Array<string>) => {
    blacklist = [...cities, ...blacklist];
    return Rx.Observable.from(cities);
  })
  // get categories
  .flatMap((pageUrl: string) => {
    return getLinks(`${Hosts.bizgid}${removeForwardSlash(pageUrl)}/`);
  })
  .flatMap((cityCategories: Array<string>) => {
    return Rx.Observable.from(cityCategories);
  })
  // get subcategories and companies
  .flatMap((category: string) => {
    const removedForwardSlash = removeForwardSlash(category);
    return getLinks(`${Hosts.bizgid}${removedForwardSlash}/`, {
      hostlink: `${Hosts.bizgid}${removedForwardSlash}`,
      isAddHostLink: false,
    });
  })
  .flatMap(something => {
    // console.log(something);
    return something;
  })
  // get categories
  .subscribe(s => {});

const mainHandler: express.RequestHandler = async (
  request: express.Request,
  response: express.Response,
) => {
  try {
    pageRequest.next(Hosts.bizgid);
    response.status(HTTPCodes.success).json({ message: 'links' });
  } catch (error) {
    console.error('Error: ', error.statusCode);
  }
};

BizgidRoute.get('/', mainHandler);

export default BizgidRoute;
