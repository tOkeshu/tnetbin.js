describe("tnetbin.js", function() {

  describe("Encoder", function() {
    var encoder = new tnetbin.Encoder();

    describe('#encode', function() {

      it("null", function() {
        expect(encoder.encode(null)).toBe('0:~');
      });

      it("booleans", function() {
        expect(encoder.encode(true)).toBe('4:true!');
        expect(encoder.encode(false)).toBe('5:false!');
      });

      it("integers", function() {
        expect(encoder.encode(123)).toBe('3:123#');
      });

      it("floats", function() {
        expect(encoder.encode(3.141592653589793)).toBe('17:3.141592653589793^');
      });

      it("strings", function() {
        expect(encoder.encode('Back to the Future')).toBe('18:Back to the Future,');
      });

      it("array buffers", function() {
        var buffer = new ArrayBuffer(8);
        var s = String.fromCharCode.apply(null, new Uint8Array(buffer));
        var result = '8:' + s + ',';
        expect(encoder.encode(buffer)).toBe(result)
      });

      it("lists", function() {
        var array = ["hello", 12345, 3.14, false];
        var result = "31:5:hello,5:12345#4:3.14^5:false!]";
        expect(encoder.encode(array)).toBe(result);
      });

      it("dicts", function() {
        var object = {a: "hello", b: 12345, c: 3.14, d: false};
        var result = "47:1:a,5:hello,1:b,5:12345#1:c,4:3.14^1:d,5:false!}";
        expect(encoder.encode(object)).toBe(result);
      });

    });

  });

  describe("Decoder", function() {

    var decoder = new tnetbin.Decoder();

    describe("#decode", function() {
      it("null", function() {
        expect(decoder.decode('0:~').value).toBe(null);
      });

      it("booleans", function() {
        expect(decoder.decode('4:true!').value).toBe(true);
        expect(decoder.decode('5:false!').value).toBe(false);
      });

      it("integers", function() {
        expect(decoder.decode('11:12345678901#').value).toBe(12345678901);
      });

      it("floats", function() {
        expect(decoder.decode('17:3.141592653589793^').value).toBe(3.141592653589793);
      });

      it("strings", function() {
        expect(decoder.decode('18:Back to the Future,').value).toBe('Back to the Future');
      });

      it("array buffers", function() {
        var buffer = new ArrayBuffer(22);
        var view   = new Uint8Array(buffer);
        for (var i=0; i < 22; i++)
          view[i] = '18:Back to the Future,'.charCodeAt(i);
        expect(decoder.decode(buffer).value).toBe('Back to the Future');
      });

      it("lists", function() {
        var tnet = "31:5:hello,5:12345#4:3.14^5:false!]";
        var list = ["hello", 12345, 3.14, false];
        expect(decoder.decode(tnet).value).toEqual(list);
      });

      it("dicts", function() {
        var tnet = "47:1:a,5:hello,1:b,5:12345#1:c,4:3.14^1:d,5:false!}";
        var dict = {a: "hello", b: 12345, c: 3.14, d: false};
        expect(decoder.decode(tnet).value).toEqual(dict);
      });

      it("one element at a time", function() {
        var tnet = "12:1:1#1:2#1:3#]1:4#", result;

        result = decoder.decode(tnet);
        expect(result.value).toEqual([1, 2, 3]);
        expect(result.remain).toEqual('1:4#');

        result = decoder.decode(result.remain);
        expect(result.value).toEqual(4);
        expect(result.remain).toEqual('');
      });
    });

    describe("#isAString", function() {

      it("should be false for ArrayBuffers of odd length", function() {
        var buffer = new ArrayBuffer(3);
        expect(tnetbin.isAString(buffer)).toBe(false);
      });

    });

  });

});

describe("edge cases/bugs", function() {
  var encoder = new tnetbin.Encoder();
  var decoder = new tnetbin.Decoder();

  it("should decode empty lists", function() {
    expect(decoder.decode('0:]').value).toEqual([]);
  });

  it("should decode empty dicts", function() {
    expect(decoder.decode('0:}').value).toEqual({});
  });

  it("should decode ArrayBuffers of odd length", function() {
    var buffer = new ArrayBuffer(3);
    var view = new Uint8Array(buffer);
    for (var i=0; i < 3; i++)
      view[i] = '0:}'.charCodeAt(i);
    expect(decoder.decode(buffer).value).toEqual({});
  });

  it("should encode large ArrayBuffers", function() {
    var buffer = new ArrayBuffer(512 * 1024);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < buffer.byteLength; i++)
      view[i] = 97;
    expect(encoder.encode(buffer).length).toEqual(512 * 1024 + 8);
  });
});