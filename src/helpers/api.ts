const isDev = true;

export const MINTBASE = isDev ? 'http://localhost:5000' : 'https://api.mintlify.com';
export const GET_UNDEFINED_VARIABLES = `${MINTBASE}/docs/scan`;
export const DOCS_WRITE = MINTBASE + '/docs/write';