const isDev = false;

export const MINTBASE = isDev ? 'http://localhost:5000' : 'https://api.mintlify.com';
export const DOCS_WRITE = MINTBASE + '/docs/write/v2';
export const FEEDBACK = MINTBASE + '/docs/feedback';