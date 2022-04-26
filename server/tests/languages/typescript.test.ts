import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'typescript';

describe('TypeScript Functions', () => {
  test('Function expression with no parameters', async () => {
    const code = `function hello(): void {
      console.log('Hello, world!');
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Function expression with required parameters', async () => {
    const code = `function printKeyValue(key: string, value: string): void {
      console.log(key + ' : ' + value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
       {
         name: 'key',
         required: true,
         type: 'string',
       },
       {
         name: 'value',
         required: true,
         type: 'string',
       },
     ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('Function expression with required parameters and custom types', async () => {
    const code = `
    function nodeValues(a: Node, b: Node): void {
      console.log(a.value + ' ' + b.value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
       {
         name: 'a',
         required: true,
         type: 'Node',
       },
       {
         name: 'b',
         required: true,
         type: 'Node',
       },
     ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('Function expression with optional parameters', async () => {
    const code = `
    function multiply(a: number, b: number, c?: number): number {

      if (typeof c !== 'undefined') {
          return a * b * c;
      }
      return a * b;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
       {
         name: 'a',
         required: true,
         type: 'number',
       },
       {
         name: 'b',
         required: true,
         type: 'number',
       },
       {
        name: 'c',
        required: false,
        type: 'number',
      },
     ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: true
    });
  });

  test('Function expression with optional parameters and default value', async () => {
    const code = `
    function multiply(a: number, b: number, c = 8): number {

      if (typeof c !== 'undefined') {
          return a * b * c;
      }
      return a * b;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
       {
         name: 'a',
         required: true,
         type: 'number',
       },
       {
         name: 'b',
         required: true,
         type: 'number',
       },
       {
        name: 'c',
        required: false,
        defaultValue: '8',
      },
     ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: true
    });
  });

  test('Function expression with export statement', async () => {
    const code = `
    export function hello(): void {
      console.log('Hello, world!');
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Function expression with return in another function statement', async () => {
    const code = `
    function parentFunc(): void {
      function bar(): string {
        return 'hello';
      }
      console.log('yo');
    }
    `;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Arrow function with no return', async () => {
    const code = `const hello = (): void => {
      console.log('hello world');
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Arrow function with no parameters', async () => {
    const code = `const hello = () => {
      console.log('hello world');
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Arrow function with parameters', async () => {
    const code = `const printKeyValue = (key: string, value: string) => {
      console.log(key + ' : ' + value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
      name: 'key',
      required: true,
      type: 'string'
      },
      {
        name: 'value',
        required: true,
        type: 'string'
      },
    ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('Arrow function with return', async () => {
    const code = `const hello = () => {
      return false;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: true
    });
  });

  test('Variable declared function', async () => {
    const code = `export const school = function(id: string) {
      return schools.doc(id);
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'id',
        required: true,
        type: 'string',
      }],
      returns: true
    });
  });

  test('Variable declared function with optional params and no return', async () => {
    const code = `export const school = function(id?: string) {
      let b = 'a';
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'id',
        required: false,
        type: 'string',
      }],
      returns: false
    });
  });

  test('Function with rest params', async () => {
    const code = `function printKeyValue(key: string, ...values?: string[]): void {
      console.log(key + ' : ' + values);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'key',
          required: true,
          type: 'string'
        },
        {
          name: 'values',
          required: false,
          type: 'string[]'
        },
      ],
      returns: false
    });
  });

  test('Function with array type param', async () => {
    const code = `function printKeyValue(key: string, values: string[]): void {
      console.log(key + ' : ' + values);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'key',
          required: true,
          type: 'string'
        },
        {
          name: 'values',
          required: true,
          type: 'string[]'
        },
      ],
      returns: false
    });
  })

  // Remember to pass through the entire class/file to identify method
  test('Method with no parameters', async () => {
    const classCode = `
    class Rectangle {
      constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() : number {
        return this.calcArea();
      }
      // Method
      calcArea() : number {
        return this.height * this.width;
      }
    }
    `;

    const funcInClass = `
      calcArea() : number {
        return this.height * this.width;
      }`;
    const synopsis = getSynopsis(funcInClass, LANGUAGE_ID, classCode);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: true
    });
  });

  test('Method with parameters', async () => {
    const classCode = `
    class Rectangle {
      constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() : number {
        return this.calcArea();
      }
      // Method
      calcArea() : number {
        return this.height * this.width;
      }

      areaMultiplied(multipliedBy : number) : number {
        return multipliedBy * calcArea();
      }
    }
    `;

    const funcInClass = `
      areaMultiplied(multipliedBy : number) : number {
        return multipliedBy * calcArea();
      }`;
    const synopsis = getSynopsis(funcInClass, LANGUAGE_ID, classCode);
    const params = [
      {
      name: 'multipliedBy',
      required: true,
      type: 'number'
      }
    ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: true
    });
  });

  test('Method with no return', async () => {
    const classCode = `
    class Rectangle {
      constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() : number {
        return this.calcArea();
      }
      // Method
      hello() {
        console.log('hello world');
      }
    }
    `;

    const funcInClass = `
      hello() {
        console.log('hello world');
      }`;
    const synopsis = getSynopsis(funcInClass, LANGUAGE_ID, classCode);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Async method', async () => {
    const code = `
    const mintlifyFiles = async (): Promise<MintedResults> => {
      const errors = [];
      const mints = [];
      return {
        mints,
        errors
      };
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: true
    });
  });
});

describe('TypeScript Typedefs', () => {
  test('Properties with primative types', async () => {
    const code = `
    type UndefinedElement = {
      name: string;
      line: number;
      character: number;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const properties = [
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'line',
        type: 'number'
      },
      {
        name: 'character',
        type: 'number'
      }
    ];
    expect(synopsis).toEqual({
      kind: 'typedef',
      properties
    });
  });

  // e.g. name: NameType;
  test('Properties with complex types', async () => {
    const code = `
    type LinkedListNode = {
      value: Node;
      next: LinkedListNode;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const properties = [
      {
        name: 'value',
        type: 'Node'
      },
      {
        name: 'next',
        type: 'LinkedListNode'
      }
    ];
    expect(synopsis).toEqual({
      kind: 'typedef',
      properties
    });
  });

  // TODO: add support for optional properties
});

describe('TypeScript Classes', () => {
  test('Class with no extends', async () => {
    const code = `
    class Rectangle {
      constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() : number {
        return this.calcArea();
      }
      // Method
      hello() {
        console.log('hello world');
      }
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class'
    });
  });

  test('Class that extends another Class', async () => {
    const code = `
    class Square extends Rectangle {
      constructor(height: number, width: number) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() : number {
        return this.calcArea();
      }
      // Method
      hello() {
        console.log('hello world');
      }
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Rectangle'
    });
  });

  test('Class that implements another Class', async () => {
    const code = `
    export default class JavaScript implements PL {  
      async getSynopsis(tree: TreeNode, fileTree: TreeNode): Promise<Synopsis> {
        const functionSynopsis = getFunction(tree);
        if (functionSynopsis) return functionSynopsis;
    
        const methodSynopsis = getMethod(tree, fileTree);
        if (methodSynopsis) return methodSynopsis;
    
        const classSynopsis = getClass(tree);
        if (classSynopsis) return classSynopsis;
    
        return {
          kind: 'unspecified',
        }
      }
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'PL'
    });
  });
});

describe('TypeScript Unspecified', () => {
  test('One line of variable declaration', async () => {
    const code = "const a : string = 'a'";
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'unspecified'
    });
  });

  test('Two lines of code', async () => {
    const code = `
    const a : string = 'a';
    const b : string = 'b';
    `;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'unspecified'
    });
  });

  test('One line of calling a function', async () => {
    const code = 'fun();';
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'unspecified'
    });
  });
});

