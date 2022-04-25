import { getDocstringPrompt } from 'brain/codex/docs';
import { addComments } from 'brain/helpers';
import { CommentFormat, DocFormat } from 'constants/enums';
import { getDocFormat } from 'formatting/functions';
import { getSynopsis } from 'parsing';

const START_REGEX = /^[\w`]+/

describe('Generating docstrings' , () => {
  const TYPESCRIPT_LANGUAGE_ID = 'typescript';
  test('Typescript Auto-detect function', async () => {
    const code = 'function add(a: number, b: string): number { return a + b; }';
    const synopsis = getSynopsis(code, TYPESCRIPT_LANGUAGE_ID);
    const docFormat = getDocFormat(DocFormat.Auto, TYPESCRIPT_LANGUAGE_ID);
    const { docstring } = await getDocstringPrompt(code, synopsis, TYPESCRIPT_LANGUAGE_ID, docFormat, code);
    expect(docstring).toMatch(START_REGEX);
    expect(docstring).toContain('@param {number} a');
    expect(docstring).toContain('@param {string} b');
    expect(docstring).toContain('@returns');
  });

  const PYTHON_LANGUAGE_ID = 'python';
  test('Python Auto-detect function', async () => {
    const code = 'def greet(name): return "Greetings from " + name';
    const synopsis = getSynopsis(code, PYTHON_LANGUAGE_ID);
    const docFormat = getDocFormat(DocFormat.Auto, PYTHON_LANGUAGE_ID);
    const { docstring } = await getDocstringPrompt(code, synopsis, PYTHON_LANGUAGE_ID, docFormat, code);
    expect(docstring).toMatch(START_REGEX);
    expect(docstring).toContain(':param name:');
    expect(docstring).toContain(':return:');
  });

  const PHP_LANGUAGE_ID = 'php';
  test('PHP Google format function', async () => {
    const code = 'function addNumbers(int $a, int $b) { return $a + $b; }';
    const synopsis = getSynopsis(code, PHP_LANGUAGE_ID);
    const docFormat = getDocFormat(DocFormat.Google, PHP_LANGUAGE_ID);
    const { docstring } = await getDocstringPrompt(code, synopsis, PHP_LANGUAGE_ID, docFormat, code);
    expect(docstring).toMatch(START_REGEX);
    expect(docstring).toContain('Args:');
    expect(docstring).toContain('a (int): ');
    expect(docstring).toContain('b (int): ');
    expect(docstring).toContain('Returns:');
  });

  const JAVASCRIPT_LANGUAGE_ID = 'javascript';
  test('JavaScript default format function with no params and returns', async () => {
    const code = 'const hello = () => { console.log("Hello world") }';
    const synopsis = getSynopsis(code, JAVASCRIPT_LANGUAGE_ID);
    const docFormat = getDocFormat(DocFormat.Auto, JAVASCRIPT_LANGUAGE_ID);
    const { docstring } = await getDocstringPrompt(code, synopsis, JAVASCRIPT_LANGUAGE_ID, docFormat, code);
    expect(docstring).toMatch(START_REGEX);
    expect(docstring).not.toContain('@param');
    expect(docstring).not.toContain('@returns');
  });

  const JAVA_LANGUAGE_ID = 'javascript';

  test('Java simple unspecified with context', async () => {
    const context = 'public class HelloWorld { public static void main(String[] args) { System.out.println("Hello world"); } }';
    const code = 'System.out.println("Hello world")';
    const synopsis = getSynopsis(code, JAVA_LANGUAGE_ID);
    const docFormat = getDocFormat(DocFormat.Auto, JAVA_LANGUAGE_ID);
    const { docstring } = await getDocstringPrompt(code, synopsis, JAVA_LANGUAGE_ID, docFormat, context);
    expect(docstring).toMatch(START_REGEX);
  });

  test('Python with NumPy format commented', async () => {
    const selectedDocFormat = DocFormat.Numpy;
    const commentFormat = CommentFormat.Numpy;
    const code = 'def hello(msg="Hello World"):\n\treturn msg';
    const synopsis = getSynopsis(code, PYTHON_LANGUAGE_ID);
    const docFormat = getDocFormat(selectedDocFormat, PYTHON_LANGUAGE_ID);
    const { docstring } = await getDocstringPrompt(code, synopsis, JAVA_LANGUAGE_ID, docFormat, code);
    const commentedDocstring = addComments(docstring,  PYTHON_LANGUAGE_ID, commentFormat);
    expect(commentedDocstring).toMatch(/^'''[\w`]+/);
    expect(commentedDocstring).toContain('Parameters\n----------');
    expect(commentedDocstring).toContain('Returns\n-------');
  });
})