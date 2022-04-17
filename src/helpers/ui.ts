import * as vscode from 'vscode';
import { login } from './auth';
import { FEEDBACK } from './api';
import axios from 'axios';

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

export const displaySignInView = async (message: string, button: string) => {
	const SIGN_IN_BUTTON = button;
	const signInResponse = await vscode.window.showInformationMessage(message, button);
	if (signInResponse === SIGN_IN_BUTTON) {
		login();
	}

	return;
};

export const askForFeedbackNotification = async (feedbackId: string): Promise<number | null> => {
	const feedbackOption = await vscode.window.showInformationMessage('Are the results useful?', '👍 Yes', '👎 No');
	if (feedbackOption == null) {return null;}

	const feedbackScore = feedbackOption === '👍 Yes' ? 1 : -1;

	axios.post(FEEDBACK, {
		id: feedbackId,
		feedback: feedbackScore,
	});

	return feedbackScore;
};

export const shareNotification = async (): Promise<void> => {
	const shareOption = await vscode.window.showInformationMessage('Share Doc Writer to your friends', 'Twitter', 'Email', 'Copy link');

	switch (shareOption) {
		case 'Twitter':
			vscode.env.openExternal(vscode.Uri.parse('https://twitter.com/intent/tweet'));
			return;
		case 'Email':
			vscode.env.openExternal(vscode.Uri.parse('mailto:?to=&body=AAA,&subject=BBB'));
			return;
		case 'Copy link':
			await vscode.env.clipboard.writeText('Testing 123');
			return;
		default:
			return;
	}
};