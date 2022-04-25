import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'csharp';

describe('C# functions', () => {
  test('Function with default values and return', async () => {
    const code = `static public void scholar(string fname, string lname, bool age = true, string branch = "Computer science")
    {
        Console.WriteLine("First name: {0}", fname);
        Console.WriteLine("Last name: {0}", lname);
        Console.WriteLine("Age: {0}", age);
        Console.WriteLine("Branch: {0}", branch);
        return true;
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'fname',
        required: true,
        type: 'string'
      }, {
        name: 'lname',
        required: true,
        type: 'string'
      }, {
        name: 'age',
        required: false,
        type: 'bool',
        defaultValue: 'true',
      }, {
        name: 'branch',
        required: false,
        type: 'string',
        defaultValue: 'Computer science'
      }],
      returns: true
    });
  });

  test('Function with no params or returns', async () => {
    const code = 'public static string Read() => File.ReadAllText("output.txt");';
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
    });
  });

  test('Method with simple main', async () => {
    const file = `using System;
    using System.IO;
    
    namespace SamplePrograms
    {
        public class FileIO
        {
            public static void Write() =>
                File.WriteAllText("output.txt", "file contents");
    
            public static string Read() =>
                File.ReadAllText("output.txt");
    
            public static void Main(string[] args)
            {
                Write();
                Console.WriteLine(Read());
            }
        }
    }`;

    const selectedCode = `public static void Main(string[] args)
    {
        Write();
        Console.WriteLine(Read());
    }`;
    const synopsis = getSynopsis(selectedCode, LANGUAGE_ID, file);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{
        name: 'args',
        required: true,
        type: 'string[]'
      }]
    });
  });
});

describe('Classes', () => {
  test('Simple class', async () => {
    const code = `public class QuickSort
    {
        public static List<int> Sort(List<int> xs)
        {
            if (!xs.Any())
                return xs;
    
            var index = xs.Count() / 2;
            var x = xs[index];
            xs.RemoveAt(index);
            var left = Sort(xs.Where(v => v <= x).ToList());
            var right = Sort(xs.Where(v => v > x).ToList());
            return left.Append(x).Concat(right).ToList();
        }
    
        public static void ErrorAndExit()
        {
            Console.WriteLine("Usage: please provide a list of at least two integers to sort in the format 1, 2, 3, 4, 5");
            Environment.Exit(1);
        }
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class'
    });
  })

  test('Class with inheritance', async () => {
    const code = `public class ChildCar : Car
    {
        public ChildCar(string name)
            : base(name)
        {
        }

        public void Brake()
        {
            this.Velocity--;
            Console.WriteLine("Braked {0} to velocity {1} (with child class)",
                this.Name, this.Velocity);
        }
    }`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'class',
      extends: 'Car'
    });
  })
})