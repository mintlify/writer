const isDev = false;

export const MINTBASE = isDev ? 'http://localhost:5000' : 'https://api.mintlify.com';

export const DOCS_WRITE = MINTBASE + '/docs/write';