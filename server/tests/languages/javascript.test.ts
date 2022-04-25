import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'javascript';

describe('JavaScript Functions', () => {
  test('Function expression with no parameters', async () => {
    const code = `function hello() {
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
    const code = `function printKeyValue(key, value) {
      console.log(key + ' : ' + value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
      name: 'key',
      required: true,
      },
      {
        name: 'value',
        required: true,
      },
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('Function expression with optional parameters', async () => {
    const code = `function printKeyValue(key, value = 'default') {
      console.log(key + ' : ' + value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
      name: 'key',
      required: true,
      },
      {
        name: 'value',
        required: false,
        defaultValue: 'default',
      },
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('Function expression with export statement', async () => {
    const code = `export function printKeyValue(key, value = 'default') {
      console.log(key + ' : ' + value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
      name: 'key',
      required: true,
      },
      {
        name: 'value',
        required: false,
        defaultValue: 'default',
      },
    ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('Function expression with export default statement with function name', async () => {
    const code = `export default function printKeyValue(key, value = 'default') {
      console.log(key + ' : ' + value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
      name: 'key',
      required: true,
      },
      {
        name: 'value',
        required: false,
        defaultValue: 'default',
      },
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('Function expression with return statement', async () => {
    const code = `function hello() {
      return false;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: true
    });
  });

  test('Nested function', async () => {
    const code = `function hello() {
      function bar() {
        return 'bar';
      }
      console.log('hello');
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Arrow function with no return or params', async () => {
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
    const code = `const printKeyValue = (key, value) => {
      console.log(key + ' : ' + value);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
      name: 'key',
      required: true,
      },
      {
        name: 'value',
        required: true,
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
    const code = `export const school = function(id) {
      return schools.doc(id);
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'id',
        required: true,
      }],
      returns: true
    });
  });

  test('Variable declared function optional param', async () => {
    const code = `export const school = function(id = "default") {
      return schools.doc(id);
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'id',
        required: false,
        defaultValue: 'default',
      }],
      returns: true
    });
  });

  test('Method with no parameters', async () => {
    const classCode = `
    class Rectangle {
      constructor(height, width) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() {
        return this.calcArea();
      }
      // Method
      calcArea() {
        return this.height * this.width;
      }
    }
    `;

    const funcInClass = `
      calcArea() {
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
      constructor(height, width) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() {
        return this.calcArea();
      }
      // Method
      calcArea() {
        return this.height * this.width;
      }

      areaMultiplied(multipliedBy) {
        return multipliedBy * calcArea();
      }
    }`;

    const funcInClass = `
      areaMultiplied(multipliedBy) {
        return multipliedBy * calcArea();
      }`;
    const synopsis = getSynopsis(funcInClass, LANGUAGE_ID, classCode);
    const params = [
      {
      name: 'multipliedBy',
      required: true,
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
      constructor(height, width) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() {
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

  test('Method with extra whitespace', async () => {
    const classCode = `
    class Rectangle {
      constructor(height, width) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() {
        return this.calcArea();
      }
      // Method
      hello() {
        console.log('hello world');
      }
    }
    `;

    const funcInClass = `\n\n
      hello() {
        console.log('hello world');
      } `;
    const synopsis = getSynopsis(funcInClass, LANGUAGE_ID, classCode);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Async method', async () => {
    const code = `
    const mintlifyFiles = async () => {
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

  test('Function with rest parameters', async () => {
    const code = `
    const printKeyValue = (...args) => {
      console.log(args);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
      name: 'args',
      required: true,
      }
    ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });
  /*
    functions it can't parse:

    default export with no function name
    https://developer.mozilla.org/en-US/docs/web/javascript/reference/statements/export
    export default function () {}
  */
});

describe('JavaScript Classes', () => {
  test('Class with no extends', async () => {
    const code = `
    class Rectangle {
      constructor(height, width) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() {
        return this.calcArea();
      }
      // Method
      calcArea() {
        return this.height * this.width;
      }
    }
    `;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class'
    });
  });

  test('Class that extends another Class', async () => {
    const code = `
    class Square extends Rectangle {
      constructor(height, width) {
        this.height = height;
        this.width = width;
      }
      // Getter
      get area() {
        return this.calcArea();
      }
      // Method
      calcArea() {
        return this.height * this.width;
      }
    }
    `;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Rectangle'
    });
  });
});

describe('JavaScript Unspecified', () => {
  test('One line of variable declaration', async () => {
    const code = "const a = 'a'";
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'unspecified'
    });
  });

  test('Two lines of code', async () => {
    const code = `
    const a = 'a';
    const b = 'b';
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

