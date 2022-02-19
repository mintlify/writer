import * as vscode from 'vscode';
import * as path from 'path';

export class ProgressOptionsProvider implements vscode.TreeDataProvider<ProgressBar> {
  constructor() {}

  getTreeItem(element: ProgressBar | SettingsOptions): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): any[] {
    if (element) {
      const tracking = ["Functions"];
      const allComponents = ["Functions", "Classes", "Types"];
      return allComponents.map((component) => {
        return new ComponentOption(component, tracking.includes(component));
      });
    }

    const progress = "█▁▁▁▁▁▁▁▁▁";
    return [new ProgressBar(progress), new SettingsOptions()];
  }
}

class ProgressBar extends vscode.TreeItem {
  constructor(
    public readonly progress: string,
  ) {
    super(progress, vscode.TreeItemCollapsibleState.None);
    this.tooltip = "Progress";
    this.description = "22%";
  }
}

class SettingsOptions extends vscode.TreeItem {
  constructor() {
    super("Settings", vscode.TreeItemCollapsibleState.Collapsed);
    this.tooltip = "Open settings";
    this.description = "Click to open";
  }
}

class ComponentOption extends vscode.TreeItem {
  constructor(
    name: string,
    isTracking: boolean,
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);

    if (isTracking) {
      this.iconPath = {
        light: path.join(__filename, '..', '..', 'assets', 'light', 'check.svg'),
        dark: path.join(__filename, '..', '..', 'assets', 'dark', 'check.svg')
      };
    }
  }
}