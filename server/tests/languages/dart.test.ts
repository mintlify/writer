import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'dart';

describe('Dart functions', () => {
  test('Function with no params or return', async () => {
    const code = `void main() {
      print('Hello, world!');
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false,
    });
  })
  test('Function with params but no return', async () => {
    const code = `quicksort(List lst, int start, int end){
      if (start < end){
    
        int mid = partition(lst,start,end);
        //How to use recursive calls
        //Divide and conquer
        quicksort(lst, start, mid-1);
        quicksort(lst, mid, end);
      }
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'lst',
          required: true,
          type: 'List'
        },
        {
          name: 'start',
          required: true,
          type: 'int'
        },
        {
          name: 'end',
          required: true,
          type: 'int'
        }
      ],
      returns: false
    });
  });

  test('Function with complex params and return', async () => {
    const code = `List<int>parseInput(List<String> input){
      List<int> lst = [];
      var inputString = input.join().replaceAll(" ", "").replaceAll("'", "").split(",");
      for(var stringNumber in inputString){
        lst.add(int.parse(stringNumber));
      }
      return lst;
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'input',
          required: true,
          type: 'List<String>'
        },
      ],
      returns: true
    });
  })

  test('Function with optionally named arguments', async () => {
    const code = `function_name (argument1, {argument2}) {
      return 'Name'
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'argument1',
          required: true,
        },
        {
          name: 'argument2',
          required: false,
        },
      ],
      returns: true
    });
  });

  test('Function with optional params', async () => {
    const code = `ShowMyDetails(String name, [String lastName, int age]) {
      print(name);
      print(lastName);
      print(age);
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'name',
          required: true,
          type: 'String',
        },
        {
          name: 'lastName',
          required: false,
          type: 'String',
        },
        {
          name: 'age',
          required: false,
          type: 'int',
        },
      ],
      returns: false
    });
  });

  test('Function with default value params', async () => {
    const code = `ShowMyDetails(String name, [String lastName = 'Wang', int age = 30]) {
      print(name);
      print(lastName);
      print(age);
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'name',
          required: true,
          type: 'String',
        },
        {
          name: 'lastName',
          required: false,
          type: 'String',
          defaultValue: 'Wang',
        },
        {
          name: 'age',
          required: false,
          type: 'int',
          defaultValue: '30',
        },
      ],
      returns: false
    });
  });

  test('Function with function type params', async () => {
    const code = `int apply(int x, Function f) {
      return f(x);
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'x',
          required: true,
          type: 'int',
        },
        {
          name: 'f',
          required: true,
          type: 'Function',
        },
      ],
      returns: true
    });
  });

  test('Method in class', async () => {
    const file = `class Student {  
      var stdName;  
      var stdAge;  
      var stdRoll_nu;  
        
      showStdInfo(String name) {  
        stdName = name;
      }
    }`;
    const code = `showStdInfo(String name) {  
      stdName = name;
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, file);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'name',
          required: true,
          type: 'String',
        },
      ],
      returns: false
    });
  })
});

describe('Dart classes', () => {
  test('Simple class', async () => {
    const code = `class MyClass {
      String name;
      int age;
      MyClass(this.name, this.age);
      void showDetails() {
        print(name);
        print(age);
      }
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  })

  test('Another class', async () => {
    const code = `class Gfg {

      String geek1;
   
      void geek()
      {
          print("Welcome to $geek1");
      }
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  })

  test('Class that extends', async () => {
    const code = `class Cat extends Animal {
      Cat(String name, int age) : super(name, age);
      void talk() {
        print('meow');
      }
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Animal'
    });
  })
})