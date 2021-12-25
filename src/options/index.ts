import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class OptionsProvider implements vscode.TreeDataProvider<FormatOption> {
  constructor() {}

  getTreeItem(element: FormatOption): vscode.TreeItem {
    return element;
  }

  getChildren(element: FormatOption): FormatOption[] {
    const auto = new FormatOption('Auto-detected', 0, true);
    const jsdoc = new FormatOption('JSDoc', 0);
    const google = new FormatOption('Google', 0);
    return [auto, jsdoc, google];
  }
}

class FormatOption extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly selected: boolean = false
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
  }

  iconPath = this.selected ? {
    light: path.join(__filename, '..', '..', 'assets', 'light', 'check.svg'),
    dark: path.join(__filename, '..', '..', 'assets', 'dark', 'check.svg')
  } : { light: '', dark: '' };
}
