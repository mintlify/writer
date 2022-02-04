import { env } from 'vscode';

const isWindows = () => Boolean(env.appRoot && env.appRoot[0] !== "/");

export const KEYBINDING_DISPLAY = isWindows() ? 'Ctrl+.' : '⌘.';