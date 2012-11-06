describe("tnetbin.js", function() {

    it("encodes null", function() {
        expect(tnetbin.encode(null)).toBe('0:~');
    });

    it("encodes booleans", function() {
        expect(tnetbin.encode(true)).toBe('4:true!');
        expect(tnetbin.encode(false)).toBe('5:false!');
    });

    it("encodes integers", function() {
        expect(tnetbin.encode(123)).toBe('3:123#');
    });
});