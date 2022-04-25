import { DocstringPrompt } from 'brain/codex/docs';

export const CURSOR_MARKER = '*|CURSOR_MARKER|*';

export const EMPTY_PROMPT: DocstringPrompt = {
    docstring: CURSOR_MARKER,
    promptId: ''
}
