import * as vscode from 'vscode';
import * as path from 'path';

// Must match values in package.json `configuration`
const FORMAT_OPTIONS = [
  'Auto-detect',
  'JSDoc',
  'reST',
  'NumPy',
  'DocBlock',
  'Javadoc',
  'Google'
];

export class FormatOptionsProvider implements vscode.TreeDataProvider<FormatOption> {
  constructor() {}

  getTreeItem(element: FormatOption): vscode.TreeItem {
    return element;
  }

  getChildren(): FormatOption[] {
    const docWriterConfig = vscode.workspace.getConfiguration('docwriter');
    const defaultValue = docWriterConfig.inspect('style')?.defaultValue;
    const currentValue = docWriterConfig.get('style');
    const options = FORMAT_OPTIONS.map((option) => {
      const isDefault = option === defaultValue;
      const selected = option === currentValue;
      return new FormatOption(option, vscode.TreeItemCollapsibleState.None, isDefault, selected);
    });
    return options;
  }
}

class FormatOption extends vscode.TreeItem {
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
      title: 'Style Config',
      command: 'docs.styleConfig',
      arguments: [this.label]
    };

    this.command = onClickCommand;
  }
}
