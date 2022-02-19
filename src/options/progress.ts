import * as vscode from 'vscode';
import * as path from 'path';

export class ProgressOptionsProvider implements vscode.TreeDataProvider<ProgressBar> {
  constructor() {}

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

    const progress = "█▁▁▁▁▁▁▁▁▁";
    return [new ProgressBar(progress)];
  }
}

class ProgressBar extends vscode.TreeItem {
  constructor(
    public readonly progress: string,
  ) {
    super(progress, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = "progress";
    this.tooltip = "Progress bar (click to toggle settings)";
    this.description = "22%";
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

    if (isTracking) {
      this.iconPath = {
        light: path.join(__filename, '..', '..', 'assets', 'light', 'check.svg'),
        dark: path.join(__filename, '..', '..', 'assets', 'dark', 'check.svg')
      };
    }
  }
}