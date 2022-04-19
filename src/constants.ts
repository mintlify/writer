import { env, workspace } from 'vscode';

export const isWindows = () => Boolean(env.appRoot && env.appRoot[0] !== "/");
export const hotkeyConfigProperty = () => {
  if (isWindows()) {
    return 'hotkey.windows';
  }
  return 'hotkey.mac';
};
export const KEYBINDING_DISPLAY = (): string => {
  const hotkeyConfig = workspace.getConfiguration('docwriter').get(hotkeyConfigProperty());
  switch (hotkeyConfig) {
    case '⌘ + .':
      return '⌘ + .';
    case '⌥ + .':
      return '⌥.';
    case 'Ctrl + .':
      return 'Ctrl+.';
    case 'Alt + .':
      return 'Alt+.';
    default:
      return 'Ctrl + .';
  }
};