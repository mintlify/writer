import * as vscode from 'vscode';
import axios from 'axios';
import LanguagesHoverProvider from './hover/provider';
import { getDocStyleConfig, getHighlightedText, getWidth } from './helpers/utils';
import { changeProgressColor, removeProgressColor } from './helpers/ui';
import { resolve } from 'path';
import { DOCS_PREVIEW_ACCEPT, DOCS_WRITE, FEEDBACK, DOCS_WRITE_NO_SELECTION } from './helpers/api';
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
		let location: number | null = null;
		let line: vscode.TextLine | null = null;
		if (!highlighted) {
			let document = editor.document;
			let curPos = editor.selection.active;
			location = document.offsetAt(curPos);
			line = document.lineAt(curPos);
			if (line.isEmptyOrWhitespace) {
				return;
			}
		}

		const { languageId, getText } = editor.document;

		vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating documentation',
    }, async () => {
			const docsPromise = new Promise(async (resolve, _) => {
				try {
					const { data: { docstring, position, shouldShowFeedback, feedbackId } } = location && line ? 
					await axios.post(DOCS_WRITE_NO_SELECTION,
						{
							languageId,
							commented: true,
							userId: vscode.env.machineId,
							docStyle: getDocStyleConfig(),
							source: 'vscode',
							context: getText(),
							location,
							line: line.text,
							width: getWidth(line.firstNonWhitespaceCharacterIndex)
						}) : 
					await axios.post(DOCS_WRITE,
						{
							code: highlighted,
							languageId,
							commented: true,
							userId: vscode.env.machineId,
							docStyle: getDocStyleConfig(),
							source: 'vscode',
							context: getText(),
							width: getWidth(selection.start.character)
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
				}, 15000);
			});

			const firstToFinish = await Promise.race([docsPromise, timeout]);
			if (firstToFinish === 'Timeout') {
				vscode.window.showErrorMessage('Error: Generating documentation timed out');
			}
			resolve('Either time out or completed');
		});
	});

	const insert = vscode.commands.registerCommand('docs.insert', async (
		{ position, content, }: { position: 'above' | 'belowStartLine', content: string }
	) => {
		const editor = vscode.window.activeTextEditor;
		if (editor == null) { return; }
		if (position === 'belowStartLine') {
			// TODO : Change when adding Python
			// const curPos = editor.selection.active;
			// const startLine = editor.document.lineAt(curPos);
			const { selection } = editor;
			const start = selection.start.line;
			const startLine = editor.document.lineAt(start);

			const tabbedDocstring = content.split('\n').map((line: string) => `\t${line}`).join('\n');
			const snippet = new vscode.SnippetString(`\n${tabbedDocstring}`);
			editor.insertSnippet(snippet, startLine.range.end);
		} else if (position === 'above') {
			const snippet = new vscode.SnippetString(`${content}\n`);
			let document = editor.document;
			const curPos = editor.selection.active;
			const desiredLine = document.lineAt(curPos);
			const lineNum : number = desiredLine.range.start.line;
			const position = new vscode.Position(lineNum, desiredLine.firstNonWhitespaceCharacterIndex);
			editor.insertSnippet(snippet, position);
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
