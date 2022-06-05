import * as vscode from 'vscode';
import { login } from './auth';
import { FEEDBACK } from './api';
import axios from 'axios';

const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemname=mintlify.document';

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

const generateTweetIntentUrl = () => {
	const text = encodeURI('Check out Doc Writer for VSCode by @mintlify. It just generated documentation for me in a second');
	const url = MARKETPLACE_URL;
	return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
};

const generateFacebookIntentUrl = () => {
	const url = MARKETPLACE_URL;
	return `https://www.facebook.com/sharer.php?u=${url}`;
};

const generateMailToUrl = () => {
	const subject = encodeURI('Check out Mintlify Doc Writer');
	const body = MARKETPLACE_URL;
	return `mailto:?to=&subject=${subject}&body=${body}`;
};

export const shareNotification = async (): Promise<void> => {
	const shareOption = await vscode.window.showInformationMessage('Share Doc Writer with your friends', 'Twitter', 'Facebook', 'Email', 'Copy link');

	switch (shareOption) {
		case 'Twitter':
			const tweetUrl = generateTweetIntentUrl();
			vscode.env.openExternal(vscode.Uri.parse(tweetUrl));
			return;
		case 'Facebook':
			const facebookShareUrl = generateFacebookIntentUrl();
			vscode.env.openExternal(vscode.Uri.parse(facebookShareUrl));
		case 'Email':
			const mailToUrl = generateMailToUrl();
			vscode.env.openExternal(vscode.Uri.parse(mailToUrl));
			return;
		case 'Copy link':
			await vscode.env.clipboard.writeText(MARKETPLACE_URL);
			vscode.window.showInformationMessage('Link copied to clipboard');
			return;
		default:
			return;
	}
};