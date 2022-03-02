import * as vscode from 'vscode';
import * as path from 'path';

// Must match values in package.json `configuration`
const FORMAT_OPTIONS = [
  'Auto-detect',
  'JSDoc',
  'reST',
  'NumPy',
  'DocBlock',
  'Doxygen',
  'Javadoc',
  'Google',
  'Custom'
];

export class FormatOptionsProvider implements vscode.TreeDataProvider<FormatOption> {
  constructor() {}

  getTreeItem(element: FormatOption): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): any[] {
    if (element) {
      return [new CustomOption()];
    }

    const docWriterConfig = vscode.workspace.getConfiguration('docwriter');
    const defaultValue = docWriterConfig.inspect('style')?.defaultValue;
    const currentValue = docWriterConfig.get('style');
    const options = FORMAT_OPTIONS.map((option) => {
      const isDefault = option === defaultValue;
      const selected = option === currentValue;
      const isCustom = option === 'Custom';

      const collapsibleState = isCustom ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
      return new FormatOption(option, collapsibleState, selected, isDefault, isCustom);
    });
    return options;
  }
}

class FormatOption extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly selected: boolean = false,
    public readonly isDefault: boolean = false,
    public readonly isCustom: boolean = false,
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
    // Enable once we need to gate
    // else if (this.label === 'Custom') {
    //   this.iconPath = new vscode.ThemeIcon('lock');
    // }

    const onClickCommand: vscode.Command = {
      title: 'Style Config',
      command: 'docs.styleConfig',
      arguments: [this.label]
    };

    this.command = onClickCommand;
  }
}

class CustomOption extends vscode.TreeItem {
  constructor() {
    super('⚙', vscode.TreeItemCollapsibleState.None);
    this.description = 'Open template settings';

    this.command = {
      title: 'Open template settings',
      command: 'workbench.action.openSettings',
      arguments: ['docwriter.customTemplate']
    };
  }
}