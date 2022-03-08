import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import LanguagesHoverProvider from './hover/provider';
import { monitorWorkerStatus, getDocStyleConfig, getCustomConfig, getHighlightedText, getWidth } from './helpers/utils';
import { changeProgressColor, removeProgressColor, getIdFromPurpose, Purpose } from './helpers/ui';
import { DOCS_WRITE, FEEDBACK, DOCS_WRITE_NO_SELECTION, INTRO, PROGRESS } from './helpers/api';
import { configUserSettings } from './helpers/ui';
import { getActiveIndicatorTypeNames, ProgressOptionsProvider } from './options/progress';
import { AuthService, createConfigTree, initializeAuth, login, logout, openPortal, upgrade } from './helpers/auth';
import { hotkeyConfigProperty, KEYBINDING_DISPLAY } from './constants';

const LANGUAGES_SUPPORT = ['php', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp'];

export function activate(context: vscode.ExtensionContext) {
	// All active events can be put here
	const authService = new AuthService(context.globalState);
	configUserSettings();
	initializeAuth(authService);

	let isProgressVisible = false;
	const createProgressTree = async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor == null) {
			return;
		}

		if (!isProgressVisible) {
			const checkProgressVisibility = vscode.window.createTreeView('progress', { treeDataProvider: new ProgressOptionsProvider(undefined) });
			return checkProgressVisibility.onDidChangeVisibility((e) => {
				if (e.visible) {
					isProgressVisible = true;
					createProgressTree();
				}
			});
		}

		const { languageId, getText } = editor.document;

		const file = getText();
		const types = getActiveIndicatorTypeNames();
		let treeDataProvider;		
		try {
			const progressRes = await axios.post(PROGRESS, { file, languageId, types });
			const { data: progress } = progressRes;
			vscode.window.createTreeView('progress', { treeDataProvider: new ProgressOptionsProvider(progress) });
			treeDataProvider = new ProgressOptionsProvider(progress);
		} catch {
			treeDataProvider = new ProgressOptionsProvider(undefined);
		}

		const progressTree = vscode.window.createTreeView('progress', { treeDataProvider });
		progressTree.onDidChangeVisibility((e) => {
			if (!e.visible) {
				isProgressVisible = false;
				createProgressTree();
			}
		});
	};

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

		const { languageId, getText } = editor.document;

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
							commented: true,
							userId: vscode.env.machineId,
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
						shouldShowFirstTimeFeedback,
						feedbackId,
						cursorMarker
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
					} else if (shouldShowFirstTimeFeedback) {
						const purpose = await vscode.window.showInformationMessage(
							'What do you plan on using AI Doc Writer for?', Purpose.work, Purpose.personal, Purpose.openSource, Purpose.other
						) as Purpose;

						if (purpose == null) {return null;}

						axios.post(INTRO, {
							id: feedbackId,
							purpose: getIdFromPurpose(purpose),
						});
					}
				} catch (err: AxiosError | any) {
					resolve('Error');
					removeProgressColor();

					const { requiresAuth, requiresUpgrade, button } = err?.response?.data;

					if (requiresAuth) {
						const SIGN_IN_BUTTON = button;
						const signInResponse = await vscode.window.showInformationMessage(err.response.data.message, err.response.data.button);
						if (signInResponse === SIGN_IN_BUTTON) {
							login();
						}

						return;
					}

					else if (requiresUpgrade) {
						const UPGRADE_BUTTON = "🔐 Upgrade to continue";
						const LEARN_MORE_BUTTON = "ℹ️ Learn more";
						const upgradeResponse = await vscode.window.showInformationMessage(err.response.data.message, UPGRADE_BUTTON, LEARN_MORE_BUTTON);
						if (upgradeResponse === UPGRADE_BUTTON) {
							upgrade(authService.getEmail());
						}
						else if (upgradeResponse === LEARN_MORE_BUTTON) {
							vscode.env.openExternal(vscode.Uri.parse('https://www.mintlify.com/pricing'));
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
		createConfigTree(authService);
	});
	const updateHotkeyConfig = vscode.commands.registerCommand('docs.hotkeyConfig', async (newHotkey) => {
		if (!newHotkey) {return;}
		await vscode.workspace.getConfiguration('docwriter').update(hotkeyConfigProperty(), newHotkey);
		createConfigTree(authService);
	});
	const updateLanguageConfig = vscode.commands.registerCommand('docs.languageConfig', async (newLanguage) => {
		if (!newLanguage) {return;}
		await vscode.workspace.getConfiguration('docwriter').update('language', newLanguage);
		createConfigTree(authService);
	});
	const updateTrackingConfig = vscode.commands.registerCommand('docs.trackingTypeConfig', async (trackingConfigId, newValue) => {
		await vscode.workspace.getConfiguration('docwriter').update(trackingConfigId, newValue);
		createProgressTree();
	});

	const showUpgradeInformationMessage = vscode.commands.registerCommand('docs.upgradeInfo', async (message, button) => {
		const clickedOnButton = await vscode.window.showInformationMessage(message, button);

		if (clickedOnButton) {
			upgrade(authService.getEmail());
		}
	});

	const portalCommand = vscode.commands.registerCommand('docs.portal', async () => {
		openPortal(authService.getEmail());
	});

	const logoutCommand = vscode.commands.registerCommand('docs.logout', async () => {
		logout();
	});

	const languagesProvider =  LANGUAGES_SUPPORT.map((language) => {
		return vscode.languages.registerHoverProvider(language, new LanguagesHoverProvider());
	});

	console.log(authService.getUpgradedStatus());

	createConfigTree(authService);
	createProgressTree();
	context.subscriptions.push(
		write, insert,
		updateStyleConfig, updateHotkeyConfig, updateLanguageConfig,
		updateTrackingConfig, showUpgradeInformationMessage,
		portalCommand, logoutCommand
	);
	context.subscriptions.push(...languagesProvider);
}
