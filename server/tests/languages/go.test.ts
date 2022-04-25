import { getSynopsis } from 'parsing';

const LANG_ID = 'go';

describe('Go functions', () => {
    test('function', async () => {
        const code = `	
        func main() {
            fmt.Println("hello world")
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        expect(synopsis).toEqual({
            kind: 'function',
            params: [],
            returns: false
        });
    });

    test('function with params', async () => {
        const code = `
        func max(num1, num2 int) int {
            /* local variable declaration */
            result int
         
            if (num1 > num2) {
               result = num1
            } else {
               result = num2
            }
            return result 
         }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        const params = [{
            name: 'num1',
            required: true,
            type: 'int'
        }, {
            name: 'num2',
            required: true,
            type: 'int'
        }];
        expect(synopsis).toEqual({
            kind: 'function',
            returns: true,
            returnsType: 'int',
            params
        });
    });

    test('typedef struct', async () => {
        const code = `
        type Books struct {
            title string
            author string
            subject string
            book_id int
         }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        const properties = [{
            name: 'title',
            type: 'string'
        }, {
            name: 'author',
            type: 'string'
        }, {
            name: 'subject',
            type: 'string'
        }, {
            name: 'book_id',
            type: 'int'
        }];
        expect(synopsis).toEqual({
            kind: 'typedef',
            properties
        });
    });

    test('typedef interface', async () => {
        const code = `
        type Shape interface {
            area() float64
        }`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        const properties = [{
            name: 'area',
            type: 'float64'
        }];
        expect(synopsis).toEqual({
            kind: 'typedef',
            properties
        });
    });

    test('unspecified', async () => {
        const code = `
        var balance = [5]float32{1000.0, 2.0, 3.4, 7.0, 50.0}`;
        const synopsis = getSynopsis(code, LANG_ID, code);
        expect(synopsis).toEqual({
            kind: 'unspecified'
        });
    })
})