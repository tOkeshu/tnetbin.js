var tnetbin = {
    encode: function(obj) {
        switch (obj) {
        case null:
            return '0:~';
        case true:
            return '4:true!';
        case false:
            return '5:false!';
        }

        var type = typeof obj, s, tag;

        switch (type) {
        case 'string':
            s   = obj;
            tag = ',';
            break;
        case 'number':
            s = obj.toString();
            // Integer
            if (obj % 1 === 0)
                tag = '#';
            // Float
            else
                tag = '^';
            break;
        case 'object':
            if (obj instanceof ArrayBuffer) { // ArrayBuffer
                s = String.fromCharCode.apply(null, new Uint16Array(obj));
                tag = ',';
            } else if (obj instanceof Array) { // List
                s = obj.map(tnetbin.encode).join('');
                tag = ']';
            } else { // Object
                var attrs = [];
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) {
                        attrs.push(tnetbin.encode(attr),
                                   tnetbin.encode(obj[attr]));
                    }
                }
                s = attrs.join('');
                tag = '}';
            }
        }

        return s.length + ':' + s + tag;
    },

    decode: function(data) {
        var buffer = new ArrayBuffer(data.length * 2);
        var view = new Uint16Array(buffer);

        for (var i = 0, length = data.length; i < length; i++) {
            view[i] = data.charCodeAt(i);
        }

        var colon = 0;
        while (view[colon] != 58)
            colon++;

        if (colon === 1) {
            if (view[0] === 48)
                return null;
            if (view[0] === 52 && view[6] === 33)
                return true;
            if (view[0] === 53 && view[7] === 33)
                return false;
        }

        for (var j = colon - 1, size = 0, m = 1; j >= 0; j--, m *= 10) {
            size += m * (view[j] - 48);
        }
        var tag = view[colon + size + 1];

        if (tag === 35) {
            for (var x = (colon + size), integer = 0, n = 1; x > colon; x--, n *= 10) {
                integer += n * (view[x] - 48);
            }

            return integer;
        }

        if (tag === 94) {
            for (var i = (colon + size), dec = 0, n = 1; view[i] != 46; i--, n *= 10) {
                dec += n * (view[i] - 48);
            }

            dec = dec/n;
            i--;
            for (var integer = 0, n = 1; i > colon; i--, n *= 10) {
                integer += n * (view[i] - 48);
            }

            return integer + dec;
        }

        if (tag === 44) {
            var start = (colon + 1) * 2;
            var v = new Uint16Array(buffer, start, size);
            return String.fromCharCode.apply(null, v);
        }
    }
}

