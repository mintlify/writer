import { getSynopsis } from 'parsing';

const LANGUAGE_ID = 'ruby';

describe('Ruby Methods', () => {
  test('Simple Method with no params', async () => {
    const code = `def test
    i = 100
    j = 200
    k = 300
 return i, j, k
 end`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [],
      returns: true
    });
  });

  test('Method with default values', async () => {
    const code = `def test(a1 = "Ruby", a2 = "Perl")
    puts "The programming language is #{a1}"
    puts "The programming language is #{a2}"
 end`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'a1', required: false, defaultValue: 'Ruby' }, { name: 'a2', required: false, defaultValue: 'Perl' }],
      returns: false
    });
  });

  test('Method with variable number of params', async () => {
    const code = `def sample (*test)
      puts "The number of parameters is #{test.length}"
      for i in 0...test.length
        puts "The parameters are #{test[i]}"
      end
  end`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: '*test', required: false }],
      returns: false
    });
  });

  test('Method with one default value', async () => {
    const code = `def get_greeting_for(name="anonymous")
    return "hello #{name}"
  end`;
    const synopsis = getSynopsis(code, LANGUAGE_ID, code);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'name', required: false, defaultValue: 'anonymous' }],
      returns: true
    });
  })

  test('Method with variable number of params 2', async () => {
    const code = `def some_func(*args)
      puts args.count
      return true;
    end`;
  const synopsis = getSynopsis(code, LANGUAGE_ID, code);
  expect(synopsis).toEqual({
    kind: 'function',
    params: [{ name: '*args', required: false }],
    returns: true
  });
  });

  test('Method with context', async () => {
    const file = `def write_file
    out = File.new("output.txt", "w")
  
    out << "This is a line written by a Ruby program\n"
    out << "This line also"
  
    out.flush()
    out.close()
  end
  
  
  def read_file
    in_file = File.open("output.txt", "r")
  
    in_file.each_line do |line|
      puts line
    end
  
    in_file.close()
  end
  
  write_file()
  read_file()`;
    const code = `def read_file(file_name)
    in_file = File.open("output.txt", "r")
  
    in_file.each_line do |line|
      puts line
    end
  
    in_file.close()
  end`;

    const synopsis = getSynopsis(code, LANGUAGE_ID, file);
    expect(synopsis).toEqual({
      kind: 'function',
      params: [{ name: 'file_name', required: true }],
      returns: false
    });
  })
});

describe('Ruby classes', () => {
  test('Simple class', async () => {
    const code = `class Customer
      @@no_of_customers = 0
      def initialize(id, name, addr)
        @cust_id = id
        @cust_name = name
        @cust_addr = addr
      end
  end`;
  const synopsis = getSynopsis(code, LANGUAGE_ID, code);
  expect(synopsis).toEqual({
    kind: 'class',
  });
  });

  test('Simple class with superclass', async () => {
    const code = `class Customer < Person
      @@no_of_customers = 0
      def initialize(id, name, addr)
        @cust_id = id
        @cust_name = name
        @cust_addr = addr
      end
  end`;
  const synopsis = getSynopsis(code, LANGUAGE_ID, code);
  expect(synopsis).toEqual({
    kind: 'class',
    extends: 'Person'
  });
  });
});