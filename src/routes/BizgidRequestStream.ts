// import * as Rx from 'rxjs';
// import { _throw } from 'rxjs/observable/throw';
// import * as httpRequest from 'request-promise';

// import { Hosts, Blacklist } from '../config';
// import { extractLinksFromHTML, removeForwardSlash } from '../utils/Scrapper';
// import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

// let { bigzid: blacklist } = Blacklist;

// const getLinks = (
//   requestUrl: string,
//   params?: { hostlink: string; isAddHostLink: boolean },
// ) => {
//   const url =
//     params && params.isAddHostLink
//       ? `${params.hostlink}${requestUrl}`
//       : requestUrl;
//   const promise = httpRequest(url)
//     .then(htmlString => {
//       const links = extractLinksFromHTML({ html: htmlString, blacklist });
//       if (params) {
//         const nLinks = links.map(link => ({ link, host: params.hostlink }));
//         return nLinks;
//       }

//       return links;
//     })
//     .catch(err => console.error(`Error is: ${err}`) || _throw(err));

//   return Rx.Observable.fromPromise(promise);
// };

// // const pageRequest = new Rx.Subject();

// // pageRequest
// //   // get cities
// //   .flatMap((pageUrl: string) => getLinks(pageUrl))
// //   .flatMap((cities: Array<string>) => {
// //     blacklist = [...cities, ...blacklist];
// //     return Rx.Observable.from(cities);
// //   })
// //   .delay(10000)
// //   // get categories
// //   .flatMap((pageUrl: string) => {
// //     return getLinks(`${Hosts.bizgid}${removeForwardSlash(pageUrl)}/`);
// //   })
// //   .repeatWhen((errorObs: ErrorObservable) => errorObs.delay(10000))
// //   .flatMap((cityCategories: Array<string>) => {
// //     return Rx.Observable.from(cityCategories);
// //   })
// //   // .do(console.log)
// //   // get subcategories and companies
// //   .delay(30000)
// //   .flatMap((category: string) => {
// //     const removedForwardSlash = removeForwardSlash(category);
// //     return getLinks(`${Hosts.bizgid}${removedForwardSlash}/`, {
// //       hostlink: `${Hosts.bizgid}${removedForwardSlash}`,
// //       isAddHostLink: false,
// //     });
// //   })
// //   .repeatWhen((errorObs: ErrorObservable) => errorObs.delay(10000))
// //   .flatMap(subcategories => {
// //     return Rx.Observable.from(subcategories);
// //   });
