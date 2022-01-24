const isDev = false;

export const MINTBASE = isDev ? 'http://localhost:5000' : 'https://api.mintlify.com';
export const DOCS_WRITE = MINTBASE + '/docs/write/v2';
export const FEEDBACK = MINTBASE + '/docs/feedback';
// For preview
export const DOCS_PREVIEW = MINTBASE + '/docs/preview';
export const DOCS_PREVIEW_ACCEPT = MINTBASE + '/docs/preview/accept';