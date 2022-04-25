import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'cpp';

describe('C++ functions', () => {
  test('Function with params and return', async () => {
    const code = `int main(int argc, char *argv[])
    {
      int i,j,k,n;
      n = 21;
      for(i=1; i<=(n+1)/2; )
        {
          for(k=1; (n+1)/2-i>=k; k++)
            cout<<" ";
          for(j=1; j<2*i; j++)
            cout<<"*";
          cout<<"\n";
          i++;
        }
      if(2*i-1>=n)
        {
          for(i=(n+1)/2-1; i>=1; i--)
            {
              for(k=1; (n+1)/2-i>=k; k++)
                cout<<" ";
              for(j=1; j<2*i; j++)
                cout<<"*";
              cout<<"\n";
            }
        }
      return(0);
    }
  `;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'argc',
          required: true,
          type: 'int'
        },
        {
          name: 'argv',
          required: true,
          type: 'char'
        }
      ],
      returns: true
    });
  });

  test('Function with default params', async () => {
    const code = `void myFunction(string country = "Norway") {
      cout << country << "\n";
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'country',
          required: false,
          defaultValue: 'Norway',
          type: 'string'
        },
      ],
    });
  });

  test('Inline function', async () => {
    const code = `inline int Max(int x, int y) {
      return (x > y)? x : y;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'x',
          required: true,
          type: 'int'
        },
        {
          name: 'y',
          required: true,
          type: 'int'
        },
      ],
      returns: true,
    });
  });

  test('Function with qualified identifier as param type', async () => {
    const code = `void insertSort(std::vector <int> &v){
        int n = v.size();
        int i = 0, j = 0, temp = 0;
        for(i = 1; i < n; i++){
    int store = v[i];
    j = i-1;
    while(store < v[j] && j >= 0){
      v[j+1] = v[j];
      j--;
    }
    v[j+1] = store;
        }
        return;
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'v',
          required: true,
          type: 'vector <int>'
        },
      ],
      returns: true,
    });
  })

  test('Class method', async () => {
    const file = `class MyClass {
      public:
        void myMethod() {
          cout << "Hello World!";
        }
    };`;
    const code = `void myMethod(string msg = "Hello World!") {
      cout << msg;
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, file);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [
        {
          name: 'msg',
          type: 'string',
          defaultValue: 'Hello World!',
          required: false
        }
      ],
    });
  })
});

describe('C++ classes', () => {
  test('Simple class', async () => {
    const code = `class Car {
      public:
        string brand;   
        string model;
        int year;
    };`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',      
    });
  })
  test('With inheritance', async () => {
    const code = `class Car: public Vehicle {
      public:
        string model = "Mustang";
    };`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Vehicle'
    });
  })
})

describe('C++ typedefs', () => {
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