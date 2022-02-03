import * as vscode from 'vscode';
import { ISDEV } from './api';

export const changeProgressColor = () => {
	const workbenchConfig = vscode.workspace.getConfiguration('workbench');
	const currentColorScheme = workbenchConfig.get('colorCustomizations') as any;
	const mintlifyColorScheme = {
		"[*Dark*]": {
      "progressBar.background": "#0D9373",
      "notificationsInfoIcon.foreground": "#0D9373",
			"editor.selectionBackground": "#0D937333"
    },
    "[*Light*]": {
			"progressBar.background": "#0D9373",
      "notificationsInfoIcon.foreground": "#0D9373",
			"editor.selectionBackground": "#0D937333"
    }
	};
	workbenchConfig.update('colorCustomizations', {...currentColorScheme, ...mintlifyColorScheme}, true);
};

export const removeProgressColor = () => {
	const workbenchConfig = vscode.workspace.getConfiguration('workbench');
	const currentColorScheme = workbenchConfig.get('colorCustomizations') as any;
	const { ['[*Dark*]']: defaultDark, ['[*Light*]']: defaultLight, ...removedScheme } = currentColorScheme;
	workbenchConfig.update('colorCustomizations', removedScheme, true);
};

export const configUserSettings = () => {
	const httpConfig = vscode.workspace.getConfiguration('http');
	httpConfig.update('systemCertificates', false, true);

	// Remove color scheme in case left over
	removeProgressColor();
};

export enum Purpose {
  work = '💼 Work',
	personal = '👩‍💻 Personal',
	openSource = '🖊 Open Source',
	other = '🤷 Other'
}

export const getIdFromPurpose = (occupation: Purpose) => {
	switch (occupation) {
		case Purpose.work:
			return 'work';
		case Purpose.personal:
			return 'personal';
		case Purpose.openSource:
			return 'open-source';
		default:
			return 'other';
	}
};

export const showStatusBarButton = () => {
	const statusButton = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		0
	);
	statusButton.text = '$(pencil)';
	statusButton.tooltip = 'AI Doc Writer Settings';

	if (ISDEV) {
		statusButton.text += ' (dev)';
	}

	statusButton.command = 'docs.openSettings';
	statusButton.show();
};