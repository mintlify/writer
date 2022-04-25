import { getCode } from 'parsing';

describe('no select on function', () => {
  const languageIdPHP = 'php';
  const contextPHP = `<?php
function writeMsg() {
  echo "Hello world!";
}
function sum(string $x, C $y) {
  $z = $x + $y;
  return $z;
}
?>`;

  test('php - front of first line', async () => {
    const location = 6;
    const line = 'function writeMsg() {';
    const code = await getCode(contextPHP, languageIdPHP, location, line);

    expect(code).toEqual(
      `function writeMsg() {
  echo "Hello world!";
}`);
  });

  test('php - end of first line', async () => {
    const location = 27;
    const line = 'function writeMsg() {';
    const code = await getCode(contextPHP, languageIdPHP, location, line);
    expect(code).toEqual(
      `function writeMsg() {
  echo "Hello world!";
}`);
  });

  test('php - middle of first line', async () => {
    const location = 18;
    const line = 'function writeMsg() {';
    const code = await getCode(contextPHP, languageIdPHP, location, line);
    expect(code).toEqual(
      `function writeMsg() {
  echo "Hello world!";
}`);
  });

  const languageIdPY = 'python';
  const contextPY = `def hello_world():
  print('hello world!')`;

  test('python - front of first line', async () => {
    const location = 0;
    const line = 'def hello_world():';
    const code = await getCode(contextPY, languageIdPY, location, line);
    expect(code).toEqual(`def hello_world():
  print('hello world!')`);
  });

  test('python - middle of first line', async () => {
    const location = 9;
    const line = 'def hello_world():';
    const code = await getCode(contextPY, languageIdPY, location, line);
    expect(code).toEqual(`def hello_world():
  print('hello world!')`);
  });

  test('python - end of first line', async () => {
    const location = 18;
    const line = 'def hello_world():';
    const code = await getCode(contextPY, languageIdPY, location, line);
    expect(code).toEqual(`def hello_world():
  print('hello world!')`);
  });
});

describe('middle of function - valid', () => {
  test('php', async () => {
    const languageId = 'php';
    const context = `<?php
function writeMsg() {
  echo "Hello world!";
}
function sum(string $x, C $y) {
  $z = $x + $y;
  return $z;
}
?>`;
    const location = 50;
    const line = '  echo "Hello world!";';
    const code = await getCode(context, languageId, location, line);
    expect(code).toEqual('  echo "Hello world!";');
  });

  test('python', async () => {
    const languageId = 'python';
    const context = `def hello_world():
  print('hello world!')`;
    const location = 30;
    const line = "  print('hello world!')";
    const code = await getCode(context, languageId, location, line);
    expect(code).toEqual("  print('hello world!')");
  });

  test('javascript', async () => {
    const languageId = 'javascript';
    const context = `function hello() {
  console.log('Hello, world!');
}`;
    const location = 36;
    const line = "  console.log('Hello, world!');";
    const code = await getCode(context, languageId, location, line);
    expect(code).toEqual("  console.log('Hello, world!');");
  });
})

describe('line is not valid', () => {
  test('invalid selection', async () => {
    const languageId = 'javascript';
    const context = `function hello() {
  console.log('Hello, world!');
}`;
    const location = 52;
    const line = '}';
    try {
      await getCode(context, languageId, location, line);
    } catch (e) {
      expect(e).toMatch('Select a complete line of code (or the first line of a function)');
    }
  })
})

describe('detecting methods', () => {
  test('js', async () => {
    const languageId = 'javascript';
    const context = `const Parent = () => {
  const childFunc = () => {
    console.log('hello');
  };
};`;
    const location = 37;
    const line = '  const childFunc = () => {';
    const code = await getCode(context, languageId, location, line);
    expect(code).toEqual(`const childFunc = () => {
    console.log('hello');
  };`);
  });

  test('ts', async () => {
    const languageId = 'typescript';
    const context = `export default class RequirementFulfillmentGraph<
  Requirement extends string,
  Course extends CourseWithUniqueId
> {

  public getAllRequirements(): readonly Requirement[] {
    return Array.from(this.requirementToCoursesMap.keys());
  }
}`;
    const location = 134;
    const line = '  const childFunc = () => {';
    const code = await getCode(context, languageId, location, line);
    expect(code).toEqual(`public getAllRequirements(): readonly Requirement[] {
    return Array.from(this.requirementToCoursesMap.keys());
  }`);
  });

  test('python', async () => {
    const languageId = 'python';
    const context = `class Plus(Expression):
  def evaluate(self, environment):
    x = self.x.evaluate(environment)
    y = self.y.evaluate(environment)
    assert isinstance(x, int) and isinstance(y, int)
    return x + y`;
    const location = 44;
    const line = '  def evaluate(self, environment):';
    const code = await getCode(context, languageId, location, line);
    expect(code).toEqual(`def evaluate(self, environment):
    x = self.x.evaluate(environment)
    y = self.y.evaluate(environment)
    assert isinstance(x, int) and isinstance(y, int)
    return x + y`);
    });

  test('php', async () => {
    const languageId = 'php';
    const context = `<?php
class POP3
{
  public function helloWorld()
  {
    echo 'Hello, World!';
  }
}
?>`;
    const location = 31;
    const line = '  public function helloWorld()';
    const code = await getCode(context, languageId, location, line);
    expect(code).toEqual(`public function helloWorld()
  {
    echo 'Hello, World!';
  }`);
  });
})