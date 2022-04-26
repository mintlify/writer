import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'kotlin';

describe('Kotlin functions', () => {
  test('Simple function with no params', async () => {
    const code = `fun printName() {
      print("Adam")
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false,
    });
  })

  test('Function with multiple params', async () => {
    const code = `fun printName(firstName: String, lastName: String) {
      print("$firstName $lastName")
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'firstName',
          type: 'String',
          required: true,
        },
        {
          name: 'lastName',
          type: 'String',
          required: true,
        },
      ],
      returns: false,
    });
  })

  test('Function with return statement', async () => {
    const code = `fun printName(firstName: String, lastName: String): String {
      return "$firstName $lastName"
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'firstName',
          type: 'String',
          required: true,
        },
        {
          name: 'lastName',
          type: 'String',
          required: true,
        },
      ],
      returns: true,
    });
  })

  test('Function with nullable params params', async () => {
    const code = `fun printHello(name: String?): Unit {
      if (name != null)
          println("Hello $name")
      else
          println("Hi there!")
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'name',
          type: 'String?',
          required: false,
        },
      ],
      returns: false,
    });
  });

  test('Override function' , async () => {
    const code = `override fun projectOpened(project: Project) {
      return project.service<MyProjectService>()
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'project',
          type: 'Project',
          required: true,
        },
      ],
      returns: true,
    });
  })

  // TODO: Add default params setup
})

describe('Kotlin methods', () => {
  test('Method with context', async () => {
    const file = `class Machine : Runner {
      override fun run() {
          println("Running")
      }
    }`;
    const code = `override fun run() {
      println("Running")
    }`
    const synopsis = getSynopsis(code, LANGUAGE_ID, file);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false,
    });
  })
})

describe('Kotlin classes', () => {
  test('Simple class', async () => {
    const code = 'class Machine {}';
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  });

  test('Class with companion object', async () => {
    const code = `class Person {
      companion object {
          val NAME_KEY = "name_key"
      }
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  })

  test('Class with constructor', async () => {
    const code = `class Person(val name: String) {
      private var age: Int? = null
  
      constructor(name: String, age: Int) : this(name) {
          this.age = age
      }
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  })

  test('Inherits', async () => {
    const code = `class MyView : View {
      constructor(ctx: Context) : super(ctx)
  
      constructor(ctx: Context, attrs: AttributeSet) : super(ctx, attrs)
    }`
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'View',
    });
  })

  test('Inherits class caller', async () => {
    const code = `class Circle() : Shape() {
      override fun draw() { /*...*/ }
    }`
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Shape',
    });
  })
});

describe('Kotlin data classes', () => {
  test('Simple data class', async () => {
    const code = 'data class Person(val name: String, val age: Int? = 8)';
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'typedef',
      properties: [
        {
          name: 'name',
          type: 'String',
        },
        {
          name: 'age',
          type: 'Int?',
        },
      ]
    });
  });
});

describe('Kotlin unspecified', () => {
  test('One line of code', async () => {
    const code = 'print(person.name)';
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'unspecified',
    });
  });

  test('Multipled unpatterned lines', async () => {
    const code = `val name = "Adam"
    val greeting = "Hello, " + name
    val greetingTemplate = "Hello, $name"`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'unspecified',
    });
  });

  test('If statements', async () => {
    const code = `if (someBoolean) {
      doThing()
    } else {
        doOtherThing()
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID);
    expect(synopsis).toEqual({
      kind: 'unspecified',
    });
  })
});

