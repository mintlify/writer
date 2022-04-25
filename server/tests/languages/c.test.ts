import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'c';

describe('C functions', () => {
  test('Function with no returns or params', async () => {
    const code = `void main() {
      printf("Hello World");
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
    });
  })


  test('Function with simple params', async () => {
    const code = `int max(int num1, int num2) {
      int result;
      if (num1 > num2)
         result = num1;
      else
         result = num2;
    
      return result; 
   }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'num1',
          required: true,
          type: 'int'
        },
        {
          name: 'num2',
          required: true,
          type: 'int'
        }
      ],
      returns: true
    });
  });

  test('Function with pointer function name', async () => {
    const code = `char *captialize(char str[]) {
      for(int i = 0; i < strlen(str); i++) {
          if(i == 0) {
              str[i] = toupper(str[i]);
          } else {
              continue;
          }
      }
      return str;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'str',
        required: true,
        type: 'char'
      }],
      returns: true
    });
  })

  test('Function with dynamic types params', async () => {
    const code = `int max(Car: car) {
      return 8; 
   }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'car',
        required: true,
        type: 'Car'
      }],
      returns: true
    });
  });

  test('Function with pointer params', async () => {
    const code = `void swap_elements(long *arr, size_t i, size_t j)
    {
        long temp;
        temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'arr',
          required: true,
          type: 'long'
        },
        {
          name: 'i',
          required: true,
          type: 'size_t'
        },
        {
          name: 'j',
          required: true,
          type: 'size_t'
        }
      ]
    });
  });

  test('Function with void param', async () => {
    const code = `int main(void)
    {
        for (unsigned int i = 1; i <= 100; i++) {
            if (i % 15 == 0) {
                puts(“FizzBuzz”);
            } else if (i % 3 == 0) {
                puts(“Fizz”);
            } else if (i % 5 == 0) {
                puts(“Buzz”);
            } else {
                printf(“%u\n”, i);
            }
        }
        return 0;
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: true,
    });
  })
})

describe('C typedefs', () => {
  test('Typedef without struct', async () => {
    const code = 'typedef int length;';
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'typedef',
      properties: []
    });
  })

  test('Simple struct', async () => {
    const code = `typedef struct {
      int x;
      int y;
    } Point;`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'typedef',
      properties: [
        {
          name: 'x',
          type: 'int'
        },
        {
          name: 'y',
          type: 'int'
        }
      ]
    });
  })
})