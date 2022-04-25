import { getProgress } from 'parsing/progress';
import { ProgressIndicator } from 'routes/writer/progress';

describe('Testing progress', () => {
  const ONLY_FUNCTIONS: ProgressIndicator[] = ['Functions'];
  test('Progress on functions', async () => {
    const file = 'const test = () => {\n  return 1;\n}\n/**\n * this is a test function\n */\nfunction test2() {\n  return 2;\n}\n';
    const languageId = 'javascript';
    const progress = await getProgress(file, languageId, ONLY_FUNCTIONS);
    expect(progress.current).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.breakdown.Functions).toEqual({current: 1, total: 2});
  });

  test('No documented functions', async () => {
    const file = 'const test = () => {\n  return 1;\n}\nfunction test2() {\n  return 2;\n}\nconsole.log("Hello world")';
    const languageId = 'javascript';
    const progress = await getProgress(file, languageId, ONLY_FUNCTIONS);
    expect(progress.current).toBe(0);
    expect(progress.total).toBe(2);
  });

  const ONLY_CLASSES: ProgressIndicator[] = ['Classes'];
  test('Detected classes', async () => {
    const file = `class MyClass:
    """A simple example class"""
    i = 12345

    def f(self):
        return 'hello world'
        
class MyOtherClass:
  i = 20

  def hello(msg):
      return msg`
    const languageId = 'python';
    const progress = await getProgress(file, languageId, ONLY_CLASSES);
    expect(progress.current).toBe(1);
    expect(progress.total).toBe(2);
  });

  test('Classes with only function configuration', async () => {
    const file = `class MyClass:
    """A simple example class"""
    i = 12345

    def f(self):
        return 'hello world'`
    const languageId = 'python';
    const progress = await getProgress(file, languageId, ONLY_FUNCTIONS);
    expect(progress.current).toBe(0);
    expect(progress.total).toBe(0);
  });

  test('Class in PHP', async () => {
    const file = `<?php

    class POP3
    {
      public function helloWorld()
      {
        echo 'Hello, World!';
      }
    }
    
    ?>`;
    const languageId = 'php';
    const progress = await getProgress(file, languageId, ONLY_CLASSES);
    expect(progress.current).toBe(0);
    expect(progress.total).toBe(1);
  })

  const ONLY_TYPES: ProgressIndicator[] = ['Types'];

  test('Classes with only function configuration', async () => {
    const file = `type MyType = {
      i: number
    }

    /** A simple example class
     * @property i {number} A number
     */
    type MyOtherType = {
      i: number
    }`
    const languageId = 'typescript';
    const progress = await getProgress(file, languageId, ONLY_TYPES);
    expect(progress.current).toBe(1);
    expect(progress.total).toBe(2);
  });

  const ONLY_METHODS: ProgressIndicator[] = ['Methods'];
  const ALL_TYPES = [...ONLY_FUNCTIONS, ...ONLY_CLASSES, ...ONLY_TYPES, ...ONLY_METHODS];
  test('All types', async () => {
    const file = `type MyType = {
      summary: string;
    }
    
    /**
     * MyOtherType is a type that has an index property of type number.
     * @property {number} index - The index of the item in the array.
     */
    type MyOtherType = {
      index: number;
    }
    
    class Hello {
      print() {
        return 'Hello world';
      }
    }
    
    /**
     * Wrap the given code in the given start and end strings
     * @param {string} code - The code to wrap around.
     * @param {string} start - The start of the code block.
     * @param {string} end - The end of the code block.
     * @param [newLine=true] - If true, the code will be wrapped in a new line.
     * @returns The code wrapped in the start and end tags.
     */
    const wrapAround = (code: string, start: string, end: string, newLine = true): string => {
      if (newLine) {
        return \`\${start}\n\${code}\n\${end}\`;
      }
    
      return \`\${start} \${code} \${end}\`;
    };
    
    const singleLine = (code: string, comment: string): string => {
      return code.split('\n').map((line) => \`\${comment} \${line}\`).join('\n');
    };`;

    const languageId = 'typescript';
    const progress = await getProgress(file, languageId, ALL_TYPES);
    expect(progress.current).toBe(2);
    expect(progress.total).toBe(6);
  });

  test('Methods', async () => {
    const file = `<?php
    class POP3
    {
      /**
       * Print the string 'Hello, World!' to the screen
       */
      public function helloWorld()
      {
        echo ‘Hello, World!’;
      }
    }
    ?>`
    const languageId = 'php';
    const progress = await getProgress(file, languageId, ALL_TYPES);
    expect(progress.current).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.breakdown.Methods).toEqual({current: 1, total: 1});
  })
})