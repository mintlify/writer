import * as vscode from 'vscode';
import * as path from 'path';

const LANGUAGES = [
  'English',
  'Chinese',
  'French',
  'Korean',
  'Russian',
  'Spanish'  
];

export class LanguageOptionsProvider implements vscode.TreeDataProvider<LanguageOption> {
  private isUpgraded: boolean;
  
  constructor(isUpgraded: boolean) {
    this.isUpgraded = isUpgraded;
  }

  getTreeItem(element: LanguageOption): vscode.TreeItem {
    return element;
  }

  getChildren(): LanguageOption[] {
    const docWriterConfig = vscode.workspace.getConfiguration('docwriter');
    const defaultValue = docWriterConfig.inspect('language')?.defaultValue;
    const currentValue = docWriterConfig.get('language');
    
    const options = LANGUAGES.map((option) => {
      const isDefault = option === defaultValue;
      const selected = option === currentValue;
      const isUpgraded = this.isUpgraded;
      return new LanguageOption(option, vscode.TreeItemCollapsibleState.None, isDefault, selected, isUpgraded);
    });
    return options;
  }
}

class LanguageOption extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isDefault: boolean = false,
    public readonly selected: boolean = false,
    public readonly isUpgraded: boolean = false,
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
    } else if (!this.isDefault && !this.isUpgraded) {
      this.iconPath = new vscode.ThemeIcon('lock');
      this.command = {
        title: 'Show Upgrade Info Message',
        command: 'docs.upgradeInfo',
        arguments: ['Upgrade to a premium plan for non-english outputs', '🔐 Try for free']
      };

      return;
    }

    this.command = {
      title: 'Language Config',
      command: 'docs.languageConfig',
      arguments: [this.label]
    };
  }
}
