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
    id: 'progress.trackMethods',
    name: 'Methods',
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

type Progress = {
  current: number;
  total: number;
  breakdown: Record<string, { current: number, total: number }>,
  hasNotCompletedOnboarding?: { hasGeneratedFunction: boolean, hasGeneratedUnspecified: boolean }
};

export class ProgressOptionsProvider implements vscode.TreeDataProvider<ProgressBar> {
  private progress?: Progress;

  constructor(progress?: Progress) {
    this.progress = progress;
  }

  getTreeItem(element: ProgressBar): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): any[] {
    if (!this.progress) {
      return [new ErrorPage("Language not supported")];
    }

    if (this.progress.hasNotCompletedOnboarding) {
      const { hasGeneratedFunction, hasGeneratedUnspecified } = this.progress.hasNotCompletedOnboarding;
      return [
        new OnboardingTodo('Document a function', hasGeneratedFunction),
        new OnboardingTodo('Document a line of code', hasGeneratedUnspecified)
      ];
    }

    if (element?.id === 'progress') {
      return trackingConfigIds.map((config) => {
        const breakdown = this.progress?.breakdown[config.name];
        return new ComponentOption(config, breakdown);
      });
    }

    const percentage = this.progress.total != 0
      ? Math.round(this.progress.current * 100 / this.progress.total)
      : 100;
    const bar = buildUnicodeProgressBar(percentage);

    return [new ProgressBar(bar, this.progress)];
  }
}

class ProgressBar extends vscode.TreeItem {
  constructor(
    public readonly bar: string,
    public readonly progress?: Progress
  ) {
    super(bar, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = "progress";
    this.tooltip = "Progress bar (click to toggle settings)";

    this.description = progress != null && progress.total !== 0 ? `${progress.current}/${progress.total}` : 'None';
  }
}

class ComponentOption extends vscode.TreeItem {
  constructor(
    config: TrackingConfig,
    breakdown?: { current: number, total: number }
  ) {
    super(config.name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `Click to toggle ${config.name.toLowerCase()} in progress tracking`;

    const docWriterConfig = vscode.workspace.getConfiguration('docwriter');
    const configId = config.id;
    const isTracking = Boolean(docWriterConfig.get(configId));

    if (breakdown) {
      this.description = breakdown.total !== 0 ? `${breakdown.current}/${breakdown.total}` : 'None';
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

class OnboardingTodo extends vscode.TreeItem {
  constructor(
    name: string,
    hasCompleted: boolean,
  ) {
    super(name, vscode.TreeItemCollapsibleState.None);
    this.tooltip = "Complete by selecting the code and clicking the `Generate docs` button";

    this.iconPath = hasCompleted ? new vscode.ThemeIcon('pass-filled') : new vscode.ThemeIcon('circle-large-outline');
  }
}

class ErrorPage extends vscode.TreeItem {
  constructor(error: string) {
    super(error, vscode.TreeItemCollapsibleState.None);

    this.iconPath = new vscode.ThemeIcon('info');
  }
}