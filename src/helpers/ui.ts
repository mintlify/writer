import * as vscode from 'vscode';
import { login } from './auth';

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

export const displaySignInView = async (message: string, button: string) => {
	const SIGN_IN_BUTTON = button;
	const signInResponse = await vscode.window.showInformationMessage(message, button);
	if (signInResponse === SIGN_IN_BUTTON) {
		login();
	}

	return;
};