import * as cheerio from 'cheerio';

const REGEX_FOR_SUBCATEGORY = /\/(.*)\//;

const blacklistGenerator = ({
  blacklist,
  params = {
    removeHost: false,
    host: '',
  },
}: {
  blacklist: Array<string>;
  params: { removeHost: boolean; host: string };
}): Array<string> => {
  if (!params.removeHost) return blacklist;

  return blacklist.map(link => {
    if (!link.includes(params.host)) return link;

    const dividedIntoArray = link.split('/').filter(x => x);
    const formattedLink = dividedIntoArray[dividedIntoArray.length - 1];
    return `/${formattedLink}/`;
  });
};

const extractLinksFromHTML = ({
  html,
  blacklist,
  params = {
    removeHost: false,
    host: '',
  },
}: {
  html: string;
  blacklist: Array<string>;
  params: {
    removeHost: boolean;
    host: string;
  };
}): Array<string> => {
  const $ = cheerio.load(html);
  const listofA = $('a');

  const ignoreHref = blacklistGenerator({ blacklist, params });

  let links = Object.keys(listofA).map(key => {
    if (listofA[key].attribs) {
      const isItInBlacklist = ignoreHref.filter(
        hrefLink => listofA[key].attribs.href === hrefLink,
      );

      return isItInBlacklist.length !== 0 ? null : listofA[key].attribs.href;
    }
    return null;
  });

  links = links.filter(href => href);

  return removeDuplicateFromArray(links);
};

const removeForwardSlash = (link: string): string => link.replace(/\//g, '');

const removeDuplicateFromArray = array =>
  array.filter((element, index, self) => index == self.indexOf(element));

const isSubcategory = (link: string): boolean =>
  REGEX_FOR_SUBCATEGORY.test(link);

export {
  isSubcategory,
  extractLinksFromHTML,
  removeForwardSlash,
  removeDuplicateFromArray,
};
