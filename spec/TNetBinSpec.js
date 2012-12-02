describe("tnetbin.js", function() {

    describe('encodes', function() {

        it("null", function() {
            expect(tnetbin.encode(null)).toBe('0:~');
        });

        it("booleans", function() {
            expect(tnetbin.encode(true)).toBe('4:true!');
            expect(tnetbin.encode(false)).toBe('5:false!');
        });

        it("integers", function() {
            expect(tnetbin.encode(123)).toBe('3:123#');
        });

        it("floats", function() {
            expect(tnetbin.encode(3.141592653589793)).toBe('17:3.141592653589793^');
        });

        it("strings", function() {
            expect(tnetbin.encode('Back to the Future')).toBe('18:Back to the Future,');
        });

        it("array buffers", function() {
            var buffer = new ArrayBuffer(16);
            var s = String.fromCharCode.apply(null, new Uint16Array(buffer));
            var result = '8:' + s + ',';
            expect(tnetbin.encode(buffer)).toBe(result)
        });

        it("lists", function() {
            var array = ["hello", 12345, 3.14, false];
            var result = "31:5:hello,5:12345#4:3.14^5:false!]";
            expect(tnetbin.encode(array)).toBe(result);
        });

        it("dicts", function() {
            var object = {a: "hello", b: 12345, c: 3.14, d: false};
            var result = "47:1:a,5:hello,1:b,5:12345#1:c,4:3.14^1:d,5:false!}";
            expect(tnetbin.encode(object)).toBe(result);
        });

    });

    describe("decodes", function() {
        it("null", function() {
            expect(tnetbin.decode('0:~').value).toBe(null);
        });

        it("booleans", function() {
            expect(tnetbin.decode('4:true!').value).toBe(true);
            expect(tnetbin.decode('5:false!').value).toBe(false);
        });

        it("integers", function() {
            expect(tnetbin.decode('11:12345678901#').value).toBe(12345678901);
        });

        it("floats", function() {
            expect(tnetbin.decode('17:3.141592653589793^').value).toBe(3.141592653589793);
        });

        it("strings", function() {
            expect(tnetbin.decode('18:Back to the Future,').value).toBe('Back to the Future');
        });

        it("lists", function() {
            var tnet = "31:5:hello,5:12345#4:3.14^5:false!]";
            var list = ["hello", 12345, 3.14, false];
            expect(tnetbin.decode(tnet).value).toEqual(list);
        });

        it("dicts", function() {
            var tnet = "47:1:a,5:hello,1:b,5:12345#1:c,4:3.14^1:d,5:false!}";
            var dict = {a: "hello", b: 12345, c: 3.14, d: false};
            expect(tnetbin.decode(tnet).value).toEqual(dict);
        });
    });
});
