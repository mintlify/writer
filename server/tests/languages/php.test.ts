import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'php';

describe('PHP functions', () => {
  test('function wrapped', async () => {
    const code = `<?php
    function helloWorld() {
      echo "Hello world!";
    }
    ?>`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
    });
  });

  test('function unwrapped', async () => {
    const code = `
    function helloWorld() {
      echo "Hello world!";
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
    });
  });

  test('function with params', async () => {
    const code = `
    function familyName($fname) {
      echo "$fname Refsnes.<br>";
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
        name: 'fname',
        required: true
      }
    ];
    expect(synopsis).toEqual({
      kind: 'function',
      params,
    });
  });

  test('function with default params', async () => {
    const code = `function setHeight($minheight = 50) {
      echo "The height is : $minheight <br>";
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
        name: 'minheight',
        required: false
      }
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params
    });
  });

  test('method with params', async () => {
    const file = `
    class PHPMailer {
      public function isHTML($isHtml = true)
        {
            if ($isHtml) {
                $this->ContentType = static::CONTENT_TYPE_TEXT_HTML;
            } else {
                $this->ContentType = static::CONTENT_TYPE_PLAINTEXT;
            }
        }
   }`;
   const func = `
   public function isHTML($isHtml = true)
   {
       if ($isHtml) {
           $this->ContentType = static::CONTENT_TYPE_TEXT_HTML;
       } else {
           $this->ContentType = static::CONTENT_TYPE_PLAINTEXT;
       }
   }`;
    const synopsis = getSynopsis(func, LANGUAGE_ID, file);
    const params = [
      {
        name: 'isHtml',
        required: false
      }
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
    });
  });

  test('function with return type', async () => {
    const code = `function sha256(string $input): string {
      return hash("sha256", $input, false);
  }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
        name: 'input',
        required: true,
        type: 'string'
      }
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: true,
      returnsType: 'string',
    });
  });

  test('function with int return type', async () => {
    const code = `function addNumbers(float $a, float $b) : int {
      return (int)($a + $b);
    }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    const params = [
      {
        name: 'a',
        required: true,
        type: 'float',
      },
      {
        name: 'b',
        required: true,
        type: 'float',
      }
    ]
    expect(synopsis).toEqual({
      kind: 'function',
      params,
      returns: true,
      returnsType: 'int',
    });
  });
});

describe('PHP Classes', () => {
  test('wrapped simple class', async () => {
    const code = `<?php
    class Foo {
      public $aMemberVar = 'aMemberVar Member Variable';
      public $aFuncName = 'aMemberFunc';
     
     
      function aMemberFunc() {
          print 'Inside \`aMemberFunc()\`';
      }
  }
  ?>`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  });

  test('unwrapped simple class', async () => {
    const code = `
    class Foo {
      public $aMemberVar = 'aMemberVar Member Variable';
      public $aFuncName = 'aMemberFunc';
     
     
      function aMemberFunc() {
          print 'Inside \`aMemberFunc()\`';
      }
  }`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  });

  test('class with inheritance', async () => {
    const code = `
    class Bar extends Foo
{
    public function printItem($string)
    {
        echo 'Bar: ' . $string . PHP_EOL;
    }
}`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
    });
  });
});

describe('PHP unspecified', () => {
  test('One-line unspecified', async () => {
    const code = '$foo = new Foo();';
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'unspecified'
    });
  });
});


