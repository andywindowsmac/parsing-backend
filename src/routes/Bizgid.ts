// import * as express from 'express';

// import HTTPCodes from '../HTTPCode';

// // import * as Rx from 'rxjs';
// // import { _throw } from 'rxjs/observable/throw';
// // import * as httpRequest from 'request-promise';
// // import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

// // import { Hosts, Blacklist } from './config';
// // import { extractLinksFromHTML, removeForwardSlash } from './utils/Scrapper';

// // let { bizgid: blacklist } = Blacklist;

// // const getCities = (requestUrl: string) => {
// //   const promise = httpRequest(requestUrl)
// //     .then(htmlString => extractLinksFromHTML({ html: htmlString, blacklist }))
// //     .catch(err => console.error(`Error is: ${err}`) || _throw(err));

// //   return Rx.Observable.fromPromise(promise);
// // };

// // const getCategories = (requestUrl: string) => {
// //   const promise = httpRequest(requestUrl)
// //     .then(htmlString => extractLinksFromHTML({ html: htmlString, blacklist }))
// //     .catch(err => console.error(`Error is: ${err}`) || _throw(err));

// //   return Rx.Observable.fromPromise(promise);
// // };

// // const CitiesRequestStream = Rx.Observable.of(Hosts.bizgid)
// //   .flatMap((pageUrl: string) => getCities(pageUrl))
// //   .flatMap((cities: Array<string>) => {
// //     blacklist = [...cities, ...blacklist];
// //     return Rx.Observable.from(cities);
// //   });

// // const CategoryRequestStream = CitiesRequestStream.flatMap((pageUrl: string) => {
// //   return getCategories(`${Hosts.bizgid}${removeForwardSlash(pageUrl)}/`);
// // })
// //   .repeatWhen((errorObs: ErrorObservable) => errorObs.delay(10000))
// //   .flatMap((cityCategories: Array<string>) => {
// //     return Rx.Observable.from(cityCategories);
// //   })
// //   .subscribe(s => console.log(s));

// const BizgidRoute: express.Router = express.Router();

// const mainHandler: express.RequestHandler = async (
//   request: express.Request,
//   response: express.Response,
// ) => {
//   try {
//     response.status(HTTPCodes.success).json({ message: 'links' });
//   } catch (error) {
//     console.error('Error: ', error.statusCode);
//   }
// };

// BizgidRoute.get('/', mainHandler);

// export default BizgidRoute;
