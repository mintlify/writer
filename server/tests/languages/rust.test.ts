import { getSynopsis } from 'parsing';

const LANG_ID = 'rust';

describe('Rust', () => {
    test('function', async () => {
        const code = `fn another_function() {
            println!("Another function.");
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        expect(synopsis).toEqual({
            kind: 'function',
            returns: false,
            params: []
        })
    })

    test('function w param', async () => {
        const code = `
        fn another_function(x: i32) {
            println!("The value of x is: {}", x);
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        const params = [{
            name: 'x',
            required: true,
            type: 'i32'
        }]
        expect(synopsis).toEqual({
            kind: 'function',
            returns: false,
            params
        })
    })

    test('function w params', async () => {
        const code = `
        fn print_labeled_measurement(value: i32, unit_label: char) {
            println!("The measurement is: {}{}", value, unit_label);
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        const params = [{
            name: 'value',
            required: true,
            type: 'i32'
        }, {
            name: 'unit_label',
            required: true,
            type: 'char'
        }]
        expect(synopsis).toEqual({
            kind: 'function',
            returns: false,
            params
        })
    })

    test('function w returns', async () => {
        const code = `
        fn five() -> i32 {
            5
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        expect(synopsis).toEqual({
            kind: 'function',
            returns: true,
            returnsType: 'i32',
            params: []
        })
    })

    test('function returns unit', async () => {
        const code = `fn fizzbuzz(n: u32) -> () {
            if is_divisible_by(n, 15) {
                println!("fizzbuzz");
            } else if is_divisible_by(n, 3) {
                println!("fizz");
            } else if is_divisible_by(n, 5) {
                println!("buzz");
            } else {
                println!("{}", n);
            }
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        const params = [{
            name: 'n',
            required: true,
            type: 'u32'
        }]
        expect(synopsis).toEqual({
            kind: 'function',
            returns: false,
            params
        })
    })

    test('impl method', async () => {
        const code = `fn area(&self) -> u32 {
            self.width * self.height
        }`;
        const file = `impl Rectangle {
            fn area(&self) -> u32 {
                self.width * self.height
            }
        }`
        const synopsis = getSynopsis(code, LANG_ID, file);
        expect(synopsis).toEqual({
            kind: 'function',
            returns: true,
            returnsType: 'u32',
            params: []
        })
    })

    test('typedef struct', async () => {
        const code = `struct User {
            active: bool,
            username: String,
            email: String,
            sign_in_count: u64,
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        const properties = [{
            name: 'active',
            type: 'bool'
        }, {
            name: 'username',
            type: 'String'
        }, {
            name: 'email',
            type: 'String'
        }, {
            name: 'sign_in_count',
            type: 'u64'
        }];
        expect(synopsis).toEqual({
            kind: 'typedef',
            properties
        })
    })

    test('typedef struct', async () => {
        const code = `struct Program {
            has_error: bool,
            root: CustomNode,
          }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        expect(synopsis).toEqual({
            kind: 'typedef',
            properties: [{
                name: 'has_error',
                type: 'bool'
            }, {
                name: 'root',
                type: 'CustomNode'
            }]
        })
    })

    test('unspecified', async () => {
        const code = 'let root_node = tree.root_node();';
        const synopsis = getSynopsis(code, LANG_ID, code);
        expect(synopsis).toEqual({
            kind: 'unspecified'
        })
    })
})