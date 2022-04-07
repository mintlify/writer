import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import LanguagesHoverProvider from './hover/provider';
import { monitorWorkerStatus, getDocStyleConfig, getCustomConfig, getHighlightedText, getWidth } from './helpers/utils';
import { changeProgressColor, removeProgressColor, displaySignInView } from './helpers/ui';
import { DOCS_WRITE, FEEDBACK, DOCS_WRITE_NO_SELECTION, USERID } from './helpers/api';
import { configUserSettings } from './helpers/ui';
import { createProgressTree } from './options/progress';
import { AuthService, initializeAuth, openPortal, updateTrees, upgrade } from './helpers/auth';
import { hotkeyConfigProperty, KEYBINDING_DISPLAY } from './constants';

const LANGUAGES_SUPPORT = ['php', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'dart'];

export function activate(context: vscode.ExtensionContext) {
	// All active events can be put here
	const authService = new AuthService(context.globalState);
	configUserSettings();
	initializeAuth(authService);

	// Detect changes for progress
	vscode.workspace.onDidSaveTextDocument(() => {
		createProgressTree();
	});
	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (editor == null) {
			return;
		}
		createProgressTree();
	});

	const write = vscode.commands.registerCommand('docs.write', async () => {
		changeProgressColor();
		const editor = vscode.window.activeTextEditor;
		if (editor == null) {
			removeProgressColor();
			return;
		}

		const { languageId, getText, fileName } = editor.document;

		const { selection, highlighted } = getHighlightedText(editor);
		let location: number | null = null;
		let line: vscode.TextLine | null = null;

		// Used for cursor placement
		const startLine = selection.start.line;

		if (!highlighted) {
			removeProgressColor();
			let document = editor.document;
			let curPos = editor.selection.active;
			location = document.offsetAt(curPos);
			line = document.lineAt(curPos);
			if (line.isEmptyOrWhitespace) {
				vscode.window.showErrorMessage(`Please select a line with code and enter ${KEYBINDING_DISPLAY()} again`);
				return;
			}
			if (!LANGUAGES_SUPPORT.includes(languageId)) {
				vscode.window.showErrorMessage(`Please select code and enter ${KEYBINDING_DISPLAY()} again`);
				return;
			}
		}

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating documentation',
    }, async () => {
			const docsPromise = new Promise(async (resolve, _) => {
				try {
					const WRITE_ENDPOINT = highlighted ? DOCS_WRITE : DOCS_WRITE_NO_SELECTION;
					const { data: { id } } = await axios.post(WRITE_ENDPOINT,
						{
							languageId,
							fileName,
							commented: true,
							userId: USERID,
							email: authService.getEmail(),
							docStyle: getDocStyleConfig(),
							custom: getCustomConfig(),
							source: 'vscode',
							context: getText(),
							width: line ? getWidth(line.firstNonWhitespaceCharacterIndex) : getWidth(selection.start.character),
							// code to use for selected
							code: highlighted,
							// location for no-selection
							location,
							line: line?.text,
						});
					
					const {
						docstring,
						position,
						shouldShowFeedback,
						feedbackId,
						cursorMarker,
						// shouldShowFirstTimeFeedback, used for onboarding
					} = await monitorWorkerStatus(id);
					vscode.commands.executeCommand('docs.insert', {
						position,
						content: docstring,
						selection: selection
					});
					resolve('Completed generating');
					removeProgressColor();

					if (cursorMarker != null) {
						const start = new vscode.Position(cursorMarker.line + startLine, cursorMarker.character);
						editor.selection = new vscode.Selection(start, start);
						vscode.window.showInformationMessage(cursorMarker.message);
					}
					
					if (shouldShowFeedback) {
						const feedback = await vscode.window.showInformationMessage('Are the results useful?', '👍 Yes', '👎 No');
						if (feedback == null) {return null;}

						axios.post(FEEDBACK, {
							id: feedbackId,
							feedback: feedback === '👍 Yes' ? 1 : -1,
						});
					}
				} catch (err: AxiosError | any) {
					resolve('Error');
					removeProgressColor();

					const { requiresAuth, requiresUpgrade, message, button } = err?.response?.data;

					if (requiresAuth) {
						displaySignInView(message, button);
						return;
					}

					else if (requiresUpgrade) {
						const REFER_BUTTON = '💬 Refer friend to extend quota';
						const UPGRADE_BUTTON = "🔐 Try premium for free";
						const upgradeResponse = await vscode.window.showInformationMessage(err.response.data.message, REFER_BUTTON, UPGRADE_BUTTON);
						if (upgradeResponse === UPGRADE_BUTTON) {
							upgrade(authService.getEmail());
						}
						else if (upgradeResponse === REFER_BUTTON) {
							vscode.commands.executeCommand('docs.invite', authService, 'community', false);
						}

						return;
					}

					const errMessage = err?.response?.data?.error;
					if (errMessage != null) {
						vscode.window.showErrorMessage(errMessage);
					} else {
						vscode.window.showErrorMessage('Error occurred while generating docs');
					}
				}
			});
			
			await docsPromise;
		});
	});

	const insert = vscode.commands.registerCommand('docs.insert', async (
		{ position, content, selection }: { position: 'above' | 'belowStartLine', content: string, selection: vscode.Selection }
	) => {
		const editor = vscode.window.activeTextEditor;
		if (editor == null) { return; }

		if (position === 'belowStartLine') {
			const start = selection.start.line;
			const startLine = editor.document.lineAt(start);

			const tabbedDocstring = content.split('\n').map((line: string) => `\t${line}`).join('\n');
			const snippet = new vscode.SnippetString(`\n${tabbedDocstring}`);
			editor.insertSnippet(snippet, startLine.range.end);
		} else if (position === 'above') {
			const snippet = new vscode.SnippetString(`${content}\n`);
			let position;
			if (selection.start.line == selection.end.line && selection.start.character == selection.end.character) {
				let document = editor.document;
				const curPos = editor.selection.active;
				const desiredLine = document.lineAt(curPos);
				const lineNum : number = desiredLine.range.start.line;
				position = new vscode.Position(lineNum, desiredLine.firstNonWhitespaceCharacterIndex);
			} else {
				position = selection.start;
			}
			editor.insertSnippet(snippet, position);
		}
	});

	const updateStyleConfig = vscode.commands.registerCommand('docs.styleConfig', async (newStyle) => {
		if (!newStyle) {return;}
		await vscode.workspace.getConfiguration('docwriter').update('style', newStyle);
		updateTrees(authService);
	});
	const updateHotkeyConfig = vscode.commands.registerCommand('docs.hotkeyConfig', async (newHotkey) => {
		if (!newHotkey) {return;}
		await vscode.workspace.getConfiguration('docwriter').update(hotkeyConfigProperty(), newHotkey);
		updateTrees(authService);
	});
	const updateLanguageConfig = vscode.commands.registerCommand('docs.languageConfig', async (newLanguage) => {
		if (!newLanguage) {return;}
		await vscode.workspace.getConfiguration('docwriter').update('language', newLanguage);
		updateTrees(authService);
	});

	const showUpgradeInformationMessage = vscode.commands.registerCommand('docs.upgradeInfo', async (message, button) => {
		if (authService.getEmail() == null) {
			displaySignInView('Sign in and upgrade to unlock feature', '🔐 Sign in');
			return;
		}

		const clickedOnButton = await vscode.window.showInformationMessage(message, button);
		if (clickedOnButton) {
			upgrade(authService.getEmail());
		}
	});

	const portalCommand = vscode.commands.registerCommand('docs.portal', async () => {
		openPortal(authService.getEmail());
	});

	const languagesProvider =  LANGUAGES_SUPPORT.map((language) => {
		return vscode.languages.registerHoverProvider(language, new LanguagesHoverProvider());
	});

	context.subscriptions.push(
		write, insert,
		updateStyleConfig, updateHotkeyConfig, updateLanguageConfig,
		showUpgradeInformationMessage,
		portalCommand,
	);
	context.subscriptions.push(...languagesProvider);
}
