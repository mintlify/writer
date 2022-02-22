export const ISDEV = process.env.VSCODE_DEBUG_MODE === 'true';

export const MINTBASE = ISDEV ? 'http://localhost:5000' : 'https://api.mintlify.com';
export const DOCS_WRITE = MINTBASE + '/docs/write/v2';
export const DOCS_WRITE_NO_SELECTION = MINTBASE + '/docs/write/v2/no-selection';
export const FEEDBACK = MINTBASE + '/docs/feedback';
export const INTRO = MINTBASE + '/docs/intro';
export const PROGRESS = MINTBASE + '/progress';