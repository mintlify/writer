import * as vscode from 'vscode';

type TrackingConfig = {
  id: string;
  name: string;
};

const trackingConfigIds: TrackingConfig[] = [
  {
    id: 'progress.trackFunctions',
    name: 'Functions',
  },
  {
    id: 'progress.trackClasses',
    name: 'Classes',
  },
  {
    id: 'progress.trackTypes',
    name: 'Types',
  },
];

const buildUnicodeProgressBar = (progress: number): string => {
  const numberOfFullBars = progress / 10;
  const fullBars = "█".repeat(numberOfFullBars);
  const emptySpace = "▁".repeat(10 - numberOfFullBars);
  return `[${fullBars}${emptySpace}]`;
};

export const getActiveIndicatorTypeNames = () => {
  return trackingConfigIds.filter(
    (config) => Boolean(vscode.workspace.getConfiguration('docwriter').get(config.id))
  ).map(
    (config) => config.name
  );
};

export class ProgressOptionsProvider implements vscode.TreeDataProvider<ProgressBar> {
  private current: number;
  private total: number;
  private error: string | undefined;

  constructor(current: number, total: number, error?: string) {
    this.current = current;
    this.total = total;
    this.error = error;
  }

  getTreeItem(element: ProgressBar): vscode.TreeItem {
    if (this.error) {
      return new ErrorPage();
    }
    return element;
  }

  getChildren(element?: vscode.TreeItem): any[] {
    if (element?.id === 'progress') {
      return trackingConfigIds.map((config) => {
        return new ComponentOption(config);
      });
    }

    let percentage = 100;
    let bar = 'Settings';
    if (this.total !== 0) {
      percentage = Math.round(this.current * 100 / this.total);
      bar = buildUnicodeProgressBar(percentage);
    }

    return [new ProgressBar(bar, this.current, this.total)];
  }
}

class ProgressBar extends vscode.TreeItem {
  constructor(
    public readonly bar: string,
    public readonly current: number,
    public readonly total: number,
  ) {
    super(bar, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = "progress";
    this.tooltip = "Progress bar (click to toggle settings)";

    if (total !== 0) {
      this.description = `${current}/${total}`;
    } else {
      this.iconPath = new vscode.ThemeIcon('settings-gear');
    }
  }
}

class ComponentOption extends vscode.TreeItem {
  constructor(
    config: TrackingConfig,
  ) {
    super(config.name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `Click to toggle ${config.name.toLowerCase()} in progress tracking`;

    const docWriterConfig = vscode.workspace.getConfiguration('docwriter');
    const configId = config.id;
    const isTrackingConfigInspect = docWriterConfig.inspect(configId);
    const isTracking = Boolean(docWriterConfig.get(configId));

    const isDefault = Boolean(isTrackingConfigInspect?.defaultValue);

    if (isDefault) {
      this.description = "Default";
    }

    this.iconPath = isTracking
      ? new vscode.ThemeIcon('circle-filled')
      : new vscode.ThemeIcon('circle-outline');

    const onClickCommand: vscode.Command = {
      title: 'Changing Tracking Config',
      command: 'docs.trackingTypeConfig',
      arguments: [config.id, !isTracking]
    };

    this.command = onClickCommand;
  }
}

class ErrorPage extends vscode.TreeItem {
  constructor() {
    super('Unable to display progress', vscode.TreeItemCollapsibleState.None);
  }
}