import * as vscode from 'vscode';
import axios from 'axios';
import LanguagesHoverProvider from './hover/provider';
import { getDocStyleConfig, getHighlightedText } from './helpers/utils';
import { changeProgressColor, removeProgressColor } from './helpers/ui';
import { resolve } from 'path';
import { DOCS_PREVIEW_ACCEPT, DOCS_WRITE, FEEDBACK } from './helpers/api';
import { configUserSettings } from './helpers/ui';
import { OptionsProvider } from './options';

export function activate(context: vscode.ExtensionContext) {
	// All active events can be put herex
	configUserSettings();

	const createConfigTree = () => {
		const searchHistoryTree = new OptionsProvider();
		vscode.window.createTreeView('docsOptions', {
			treeDataProvider: searchHistoryTree
		});
	};

	const write = vscode.commands.registerCommand('docs.write', async () => {
		changeProgressColor();
		const editor = vscode.window.activeTextEditor;
		if (editor == null) {
			removeProgressColor();
			return;
		}

		const { selection, highlighted } = getHighlightedText(editor);
		if (!highlighted) {
			vscode.window.showErrorMessage('Please select code and enter ⌘. again');
			return;
		}

		const { languageId, getText } = editor.document;

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating documentation (this is taking longer than usual)',
    }, async () => {
			const docsPromise = new Promise(async (resolve, _) => {
				try {
					const rulers = vscode.workspace.getConfiguration('editor').get('rulers') as number[] | null;
					const maxWidth = rulers != null && rulers.length > 0 ? rulers[0] : 100;
					const width = maxWidth - selection.start.character;
					const { data: { docstring, position, shouldShowFeedback, feedbackId } } = await axios.post(DOCS_WRITE,
						{
							code: highlighted,
							languageId,
							commented: true,
							userId: vscode.env.machineId,
							docStyle: getDocStyleConfig(),
							source: 'vscode',
							context: getText(),
							width
						});

					vscode.commands.executeCommand('docs.insert', { position, content: docstring });
					resolve('Completed generating');
					removeProgressColor();
					
					if (shouldShowFeedback) {
						const feedback = await vscode.window.showInformationMessage('Are the results useful?', '👍 Yes', '👎 No');
						if (feedback == null) {
							return null;
						}
						axios.post(FEEDBACK, {
							id: feedbackId,
							feedback: feedback === '👍 Yes' ? 1 : -1,
						});
					}
				} catch {
					vscode.window.showErrorMessage('Error occurred while generating docs');
					resolve('Error');
					removeProgressColor();
				}
			});

			const timeout = new Promise((resolve, _) => {
				setTimeout(() => {
					resolve('Timeout');
				}, 25000);
			});

			const firstToFinish = await Promise.race([docsPromise, timeout]);
			if (firstToFinish === 'Timeout') {
				vscode.window.showErrorMessage('Error: Generating documentation timed out');
			}
			resolve('Either time out or completed');
		});
	});

	const insert = vscode.commands.registerCommand('docs.insert', async (
		{ position, content }: { position: 'above' | 'belowStartLine', content: string }
	) => {
		const editor = vscode.window.activeTextEditor;
		if (editor == null) { return; }

		const { selection } = editor;
		if (position === 'belowStartLine') {
			const start = selection.start.line;
			const startLine = editor.document.lineAt(start);

			const tabbedDocstring = content.split('\n').map((line: string) => `\t${line}`).join('\n');
			const snippet = new vscode.SnippetString(`\n${tabbedDocstring}`);
			editor.insertSnippet(snippet, startLine.range.end);
		} else if (position === 'above') {
			const snippet = new vscode.SnippetString(`${content}\n`);
			editor.insertSnippet(snippet, selection.start);
		}
	});

	const acceptPreview = vscode.commands.registerCommand('docs.acceptPreview', async (
		{ id, position, content }: { id: string, position: 'above' | 'belowStartLine', content: string }
	) => {
		await vscode.commands.executeCommand('docs.insert', { position, content });
		axios.put(DOCS_PREVIEW_ACCEPT, { id });
	});

	const updateStyleConfig = vscode.commands.registerCommand('docs.styleConfig', async (newStyle) => {
		if (!newStyle) {return;}
		await vscode.workspace.getConfiguration('docwriter').update('style', newStyle);
		createConfigTree();
	});

	const languagesProvider = ['typescript', 'javascript', 'python', 'php'].map((language) => {
		return vscode.languages.registerHoverProvider(language, new LanguagesHoverProvider());
	});

	createConfigTree();
	context.subscriptions.push(write, insert, acceptPreview, updateStyleConfig);
	context.subscriptions.push(...languagesProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {}
