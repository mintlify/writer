import * as assert from 'assert';
import * as vscode from 'vscode';
import { getFileExtension } from '../../helpers/utils';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Testing regular TS file extension', () => {
		const filename = 'test.ts';
		const fileExtension = getFileExtension(filename);
		assert.strictEqual(fileExtension, 'ts');
	});

	test('Testing regular python file extension', () => {
		const filename = 'scripts.py';
		const fileExtension = getFileExtension(filename);
		assert.strictEqual(fileExtension, 'py');
	});

	test('Testing regular react file extension', () => {
		const filename = 'App.tsx';
		const fileExtension = getFileExtension(filename);
		assert.strictEqual(fileExtension, 'tsx');
	});

	test('Testing regular test.ts file extension', () => {
		const filename = 'extension.test.ts';
		const fileExtension = getFileExtension(filename);
		assert.strictEqual(fileExtension, 'ts');
	});

	test('Testing no extension', () => {
		const filename = 'Procfile';
		const fileExtension = getFileExtension(filename);
		assert.strictEqual(fileExtension, undefined);
	});
});
