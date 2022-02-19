import * as vscode from 'vscode';
import * as path from 'path';
import { hotkeyConfigProperty, isWindows } from '../constants';

// Options must also match contributes.properties in package.json
const HOTKEY_OPTIONS_MAC = [
  '⌘ + .',
  '⌥ + .',
];
const HOTKEY_OPTIONS_WINDOWS = [
  'Ctrl + .',
  'Alt + .',
];

export class HotkeyOptionsProvider implements vscode.TreeDataProvider<HotkeyOption> {
  constructor() {}

  getTreeItem(element: HotkeyOption): vscode.TreeItem {
    return element;
  }

  getChildren(): HotkeyOption[] {
    const docWriterConfig = vscode.workspace.getConfiguration('docwriter');
    const hotkeyConfig = hotkeyConfigProperty();
    const defaultValue = docWriterConfig.inspect(hotkeyConfig)?.defaultValue;
    const currentValue = docWriterConfig.get(hotkeyConfig);
    const HOTKEY_OPTIONS = isWindows() ? HOTKEY_OPTIONS_WINDOWS : HOTKEY_OPTIONS_MAC;
    
    const options = HOTKEY_OPTIONS.map((option) => {
      const isDefault = option === defaultValue;
      const selected = option === currentValue;
      return new HotkeyOption(option, vscode.TreeItemCollapsibleState.None, isDefault, selected);
    });
    return options;
  }
}

class HotkeyOption extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isDefault: boolean = false,
    public readonly selected: boolean = false
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    if (this.isDefault) {
      this.description = 'Default';
    }

    if (this.selected) {
      this.iconPath = {
        light: path.join(__filename, '..', '..', 'assets', 'light', 'check.svg'),
        dark: path.join(__filename, '..', '..', 'assets', 'dark', 'check.svg')
      };
    }
    const onClickCommand: vscode.Command = {
      title: 'Hotkey Config',
      command: 'docs.hotkeyConfig',
      arguments: [this.label]
    };

    this.command = onClickCommand;
  }
}
