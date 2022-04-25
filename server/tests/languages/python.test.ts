import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'python';

describe('Python Functions', () => {
  test('Simple function with no params', async () => {
    const code = `def hello():
    print("Hello, world!")`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('Function with params', async () => {
    const code = `def hello(name):
    message = "Hello, " + name + "!"
    print(message)`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'name', required: true }],
      returns: false
    });
  });

  test('Function with typed params', async () => {
    const code = `def try_utf8(data: bytes) -> bool:
    try:
        data.decode('utf-8')
        return True
    except UnicodeDecodeError:
        _logger.info('Not utf-8 encoding')
        return False`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'data', type: 'bytes', required: true }],
      returns: true
    });
  });

  test('Function with default params', async () => {
    const code = `def hello(name, age = 20):
    message = "Hello, " + name + "!"
    print(message + age)`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'name', required: true }, { name: 'age', required: false, defaultValue: '20' }],
      returns: false
    });
  });

  test('Function with default typed params', async () => {
    const code = `def hello(name: str, age: number = 20):
    message = "Hello, " + name + "!"
    print(message + age)`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'name', type: 'str', required: true }, { name: 'age', required: false, type: 'number', defaultValue: '20' }],
      returns: false
    });
  });

  test('Function with decorators' , async () => {
    const code = `@app.route('/', methods=['GET', 'POST'])
    def dashboard(name):
      global APPSTATUS, start_process, stop_process, AMOUNTOFSEEDS
      respose_object = {'amountofseeds': AMOUNTOFSEEDS, 'appstatus': APPSTATUS, 'status': 'success'}
    
      return jsonify(respose_object)`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'name', required: true }],
      returns: true
    });
  })

  test('Method with params', async () => {
    const file = `class Try:
    def __init__(self):
            pass
    def printhello(self,name):
            print(f"Hello, {name}")
            return name`;

    const selection = `def printhello(self,name):
    print(f"Hello, {name}")
    return name`;
    const synopsis = getSynopsis(selection, LANGUAGE_ID, file);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'name', required: true }],
      returns: true
    });
  });
});

describe('Python Classes' , () => {
  test('Simple Class', async () => {
    const code = `class MyClass:
    i = 12345

    def f(self):
        return 'hello world'`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: null
    });
  });

  test('Class with inheritance', async () => {
    const code = `class Student(Person):
    def __init__(self, fname, lname):
      print(fname + lname)`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Person'
    });
  });

  test('Class with property inheritance', async () => {
    const code = `class Student(Person.learner):
    def __init__(self, fname, lname):
      print(fname + lname)`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Person.learner'
    });
  })
})

describe('Python unspecified', () => {
  test('One-line unspecified', async () => {
    const code = 'print("Hello, world!")';
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'unspecified'
    });
  })
})