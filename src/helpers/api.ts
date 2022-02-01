const isDev = process.env.VSCODE_DEBUG_MODE === 'true';

export const MINTBASE = isDev ? 'http://localhost:5000' : 'https://api.mintlify.com';
export const DOCS_WRITE = MINTBASE + '/docs/write/v2';
export const DOCS_WRITE_NO_SELECTION = MINTBASE + '/docs/write/v2/no-selection';
export const FEEDBACK = MINTBASE + '/docs/feedback';
export const INTRO = MINTBASE + '/docs/intro';
// For preview
export const DOCS_PREVIEW = MINTBASE + '/docs/preview';
export const DOCS_PREVIEW_ACCEPT = MINTBASE + '/docs/preview/accept';