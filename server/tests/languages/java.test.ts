import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'java';

describe('Java', () => {
  test('func with no params', async () => {
    const file = `public class HelloWorld {
  public static void helloWorld() {
    System.out.println("hello world");
  }
}`;
    const func = `public static void helloWorld() {
    System.out.println("hello world");
  }`;
    const synopsis = getSynopsis(func, LANGUAGE_ID, file);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: false
    });
  });

  test('func with no params', async () => {
    const file = `public class HelloWorld {
  public static void printS(String s) {
    System.out.println(s);
  }
}`;
    const func = `public static void printS(String s) {
    System.out.println(s);
  }`;
    const synopsis = getSynopsis(func, LANGUAGE_ID, file);
    const params = [
      {
        name: 's',
        required: true,
        type: 'String'
      }
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: false
    });
  });

  test('func with return', async () => {
    const file = `public class HelloWorld {
  public static String printS(String s) {
    return s;
  }
}`;
    const func = `public static String printS(String s) {
    return s;
  }`;
    const synopsis = getSynopsis(func, LANGUAGE_ID, file);
    const params = [
      {
        name: 's',
        required: true,
        type: 'String'
      }
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: true
    });
  });

  test('class', async () => {
    const file = `public class HelloWorld {
  public static String printS(String s) {
    return s;
  }
}`;
    const synopsis = getSynopsis(file, LANGUAGE_ID, file);

    expect(synopsis).toEqual({
      kind: 'class'
    });
  });
});
