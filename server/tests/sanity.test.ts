import { formatReturnExplained, getLocationAndRemoveMarker, getSummaryFromMultipleResponses, sanityCheck } from 'brain/codex/helpers';
import { addComments } from 'brain/helpers';
import { getLanguageIdByFilename } from 'brain/languages';
import { CommentFormat, CommentPosition } from 'constants/enums';
import { CURSOR_MARKER } from 'constants/values';
import { getFileExtension } from 'parsing/helpers';

describe('Sanity response check', () => {
  test('Normal statement', () => {
    const response = 'This is a regular summary with no special characters';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('This is a regular summary with no special characters');
  });

  test('Normal multiline', () => {
    const response = 'A simple summary\nNothing special';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('A simple summary\nNothing special');
  });

  test('Remove empty', () => {
    const response = '';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('');
  });

  test('Remove double quotes', () => {
    const response = '"Statement"';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('Statement');
  });

  test('Remove single quotes', () => {
    const response = "'Response'";
    const formatted = sanityCheck(response);
    expect(formatted).toBe('Response');
  });

  test('Leave if within response', () => {
    const response = 'The answer is "this"';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('The answer is "this"');
  })

  test('Leave apostrophy', () => {
    const response = "It's a 'test'";
    const formatted = sanityCheck(response);
    expect(formatted).toBe("It's a 'test'");
  });

  test('Trim', () => {
    const response = '  This is a test ';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('This is a test');
  });

  test('Trim left', () => {
    const response = '  \t\nThis is a test';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('This is a test');
  });

  test('Remove it is', () => {
    const response = 'It is a function that does this';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('A function that does this');
  });

  test('Remove it is lower case', () => {
    const response = 'it is a function that does this';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('A function that does this');
  });

  test('Combining trim, grave accent, and single quotes', () => {
    const response = "  'It is a function that does nothing'  ";
    const formatted = sanityCheck(response);
    expect(formatted).toBe('A function that does nothing');
  });

  test('Uppercase first character', () => {
    const response = 'this is a test';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('This is a test');
  });

  test('Uppercase first character with accent', () => {
    const response = '`helloWorld` is a function';
    const formatted = sanityCheck(response);
    expect(formatted).toBe('`helloWorld` is a function');
  });
})

describe('Return explained formatting', () => {
  test('No removal for simple response', () => {
    const response = 'A string';
    const formatted = formatReturnExplained(response);
    expect(formatted).toBe('A string');
  });

  test('Removal of the function returns', () => {
    const response = 'The function returns the values for the chart';
    const formatted = formatReturnExplained(response);
    expect(formatted).toBe('the values for the chart');
  });

  test('Removal of it is returning', () => {
    const response = 'It is returning the values for the chart';
    const formatted = formatReturnExplained(response);
    expect(formatted).toBe('the values for the chart');
  });

  test('Trimmed responses', () => {
    const response = ' It is returning the values for the chart';
    const formatted = formatReturnExplained(response);
    expect(formatted).toBe('the values for the chart');
  });
})

describe('Get best summary from summaries', () => {
  test('No summary', () => {
    const summaries = ['', '', ''];
    const summary = getSummaryFromMultipleResponses(...summaries);
    expect(summary).toBe(CURSOR_MARKER);
  });

  test('All undefined', () => {
    const summary = getSummaryFromMultipleResponses(undefined, undefined);
    expect(summary).toBe(CURSOR_MARKER);
  });

  test('One summary', () => {
    const summaries = ['A summary'];
    const summary = getSummaryFromMultipleResponses(...summaries);
    expect(summary).toBe('A summary');
  });

  test('Two summaries', () => {
    const summaries = ['A summary', 'Another summary'];
    const summary = getSummaryFromMultipleResponses(...summaries);
    expect(summary).toBe('A summary');
  });

  test('Empty first summary', () => {
    const summaries = ['', 'Another summary', 'A third summary'];
    const summary = getSummaryFromMultipleResponses(...summaries);
    expect(summary).toBe('Another summary');
  });

  test('Three summaries with marker', () => {
    const summaries = ['A summary', 'Another summary', 'A third summary'];
    const summary = getSummaryFromMultipleResponses(...summaries);
    expect(summary).toBe('A summary');
  });

  test('First is undefined', () => {
    const summaries = [undefined, 'Another summary', 'A third summary', ''];
    const summary = getSummaryFromMultipleResponses(...summaries);
    expect(summary).toBe('Another summary');
  });
});

describe('Get location and remove marker', () => {
  test('No marker', () => {
    const summary = 'A summary';
    const commentPosition = CommentPosition.Above;
    const commented = addComments(summary, 'python');
    const { docstring, cursorMarker } = getLocationAndRemoveMarker(commented, commentPosition);
    expect(docstring).toBe(commented);
    expect(cursorMarker).toBeUndefined();
  });

  test('Marker at the start', () => {
    const summary = `${CURSOR_MARKER}\nparams`;
    const commentPosition = CommentPosition.Above;
    const commented = addComments(summary, 'python');
    const { docstring, cursorMarker } = getLocationAndRemoveMarker(commented, commentPosition);
    expect(docstring).toBe('# \n# params');
    expect(cursorMarker).toHaveProperty('line', 0);
  });

  test('Marker of JSDocs', () => {
    const summary = `${CURSOR_MARKER}\n@param num - number 8`;
    const commentPosition = CommentPosition.Above;
    const commentFormat = CommentFormat.JSDoc;
    const commented = addComments(summary, 'javascript', commentFormat);
    const { docstring, cursorMarker } = getLocationAndRemoveMarker(commented, commentPosition);
    expect(docstring).toBe('/**\n * \n * @param num - number 8\n */');
    expect(cursorMarker).toHaveProperty('line', 1);
  });

  test('Marker of Python docstring', () => {
    const summary = `${CURSOR_MARKER}\nnum: number 8`;
    const position = CommentPosition.BelowStartLine;
    const commentFormat = CommentFormat.PythonDocstring;
    const commented = addComments(summary, 'python', commentFormat);
    const { docstring, cursorMarker } = getLocationAndRemoveMarker(commented, position);
    expect(docstring).toBe('"""\n\nnum: number 8\n"""');
    expect(cursorMarker).toHaveProperty('line', 2);
  });

  // Should default to above
  test('Invalid comment position', () => {
    const summary = `${CURSOR_MARKER}\n@param num - number 8`;
    const commentPosition = 'randomStr' as any;
    const commentFormat = CommentFormat.JSDoc;
    const commented = addComments(summary, 'javascript', commentFormat);
    const { docstring, cursorMarker } = getLocationAndRemoveMarker(commented, commentPosition);
    expect(docstring).toBe('/**\n * \n * @param num - number 8\n */');
    expect(cursorMarker).toHaveProperty('line', 1);
  })
})

describe('Filename extension parsing', () => {
  test('Simple filename', () => {
    const extension = getFileExtension('filename.txt');
    expect(extension).toBe('txt');
  });

  test('Simple filename javascript', () => {
    const extension = getFileExtension('filename.js');
    expect(extension).toBe('js');
  });

  test('No precursor', () => {
    const extension = getFileExtension('.env');
    expect(extension).toBe('env');
  });

  test('Multiple dots', () => {
    const extension = getFileExtension('filename.test.ts');
    expect(extension).toBe('ts');
  });

  test('No extension', () => {
    const extension = getFileExtension('Procfile');
    expect(extension).toBeUndefined();
  });

  test('No extension', () => {
    const extension = getFileExtension('Docker');
    expect(extension).toBeUndefined();
  });

  test('Regular path', () => {
    const extension = getFileExtension('/Users/user/filename.txt');
    expect(extension).toBe('txt');
  });

  test('Path with dots involved', () => {
    const extension = getFileExtension('/Users/user.han/app.py');
    expect(extension).toBe('py');
  });

  test('Path with multiple dots', () => {
    const extension = getFileExtension('/Users/user.han/app.test.java');
    expect(extension).toBe('java');
  });
})

describe('Filename to languageId', () => {
  test('Python file to python id', () => {
    const languageId = getLanguageIdByFilename('filename.py');
    expect(languageId).toBe('python');
  });

  test('Java file to java id', () => {
    const languageId = getLanguageIdByFilename('filename.java');
    expect(languageId).toBe('java');
  });

  test('JS test file to javascript id', () => {
    const languageId = getLanguageIdByFilename('filename.test.js');
    expect(languageId).toBe('javascript');
  });

  test('C# file to csharp id', () => {
    const languageId = getLanguageIdByFilename('filename.cs');
    expect(languageId).toBe('csharp');
  });

  test('Dart file to dart id', () => {
    const languageId = getLanguageIdByFilename('filename.dart');
    expect(languageId).toBe('dart');
  });

  test('Invalid language file to null', () => {
    const languageId = getLanguageIdByFilename('filename.blahblah');
    expect(languageId).toBeUndefined();
  });
})