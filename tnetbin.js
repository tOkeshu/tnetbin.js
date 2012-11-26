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
        var view   = new Uint16Array(buffer);
        var size, tag; // TNetStrings attributes
        var cursor, colon, value, decimal, multiplier; // parsing vars

        // Transform the string to an array buffer
        for (cursor = 0; cursor < data.length; cursor++)
            view[cursor] = data.charCodeAt(cursor);
        // Find the colon position
        for (colon = 0; view[colon] != 58; colon++);

        // Simple cases
        if (colon === 1) {
            // null
            if (view[0] === 48)
                return null;
            // true
            if (view[0] === 52 && view[6] === 33)
                return true;
            // false
            if (view[0] === 53 && view[7] === 33)
                return false;
        }

        size       = 0;
        cursor     = colon - 1;
        multiplier = 1;
        for (; cursor >= 0; cursor--, multiplier *= 10)
            size += multiplier * (view[cursor] - 48);
        tag = view[colon + size + 1];

        // Integers
        if (tag === 35) {
            value      = 0;
            cursor     = colon + size;
            multiplier = 1;
            for (; cursor > colon; cursor--, multiplier *= 10)
                value += multiplier * (view[cursor] - 48);

            return value;
        }

        // Floats
        if (tag === 94) {
            decimal    = 0;
            cursor     = colon + size;
            multiplier = 1;
            for (; view[cursor] != 46; cursor--, multiplier *= 10)
                decimal += multiplier * (view[cursor] - 48);
            decimal = decimal/multiplier;

            cursor--;
            value      = 0;
            multiplier = 1
            for (; cursor > colon; cursor--, multiplier *= 10)
                value += multiplier * (view[cursor] - 48);

            return value + decimal;
        }

        // Strings
        if (tag === 44) {
            var start = (colon + 1) * 2;
            var v = new Uint16Array(buffer, start, size);
            return String.fromCharCode.apply(null, v);
        }
    }
}

