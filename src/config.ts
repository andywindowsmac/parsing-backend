export interface KeyValueStringType {
  [key: string]: string;
}
export interface KeyValueArrayType {
  [key: string]: Array<string>;
}

const Blacklist: KeyValueArrayType = {
  bigzid: ['/', '/postal/', '/contacts/', '/termsofuse/', '/privacy/'],
};

const Hosts: KeyValueStringType = {
  bizgid: 'https://bizgid.kz/',
  spr: 'https://www.spr.kz/otzyvy/',
};

export { Hosts, Blacklist };
