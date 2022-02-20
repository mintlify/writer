import * as vscode from 'vscode';

const buildUnicodeProgressBar = (progress: number): string => {
  const numberOfFullBars = progress / 10;
  const fullBars = "█".repeat(numberOfFullBars);
  const emptySpace = "▁".repeat(10 - numberOfFullBars);
  return `|${fullBars}${emptySpace}|`;
};

export class ProgressOptionsProvider implements vscode.TreeDataProvider<ProgressBar> {
  private progress: number;

  constructor(progress: number) {
    this.progress = progress;
  }

  getTreeItem(element: ProgressBar): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): any[] {
    if (element?.id === 'progress') {
      const tracking = ["Functions"];
      const defaultTracking = ['Functions'];
      const allComponents = ["Functions", "Classes", "Types"];
      return allComponents.map((component) => {
        return new ComponentOption(component, tracking.includes(component), defaultTracking.includes(component));
      });
    }

    const bar = buildUnicodeProgressBar(this.progress);
    return [new ProgressBar(bar, this.progress)];
  }
}

class ProgressBar extends vscode.TreeItem {
  constructor(
    public readonly bar: string,
    public readonly progress: number,
  ) {
    super(bar, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = "progress";
    this.tooltip = "Progress bar (click to toggle settings)";
    this.description = `${progress}%`;
  }
}

class ComponentOption extends vscode.TreeItem {
  constructor(
    name: string,
    isTracking: boolean,
    isDefault: boolean,
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `Click to toggle ${name.toLowerCase()} in progress tracking`;

    if (isDefault) {
      this.description = "Default";
    }

    this.iconPath = isTracking
      ? new vscode.ThemeIcon('circle-filled')
      : new vscode.ThemeIcon('circle-outline');
  }
}