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
        var view = new Uint16Array(data.length);
        var size, tag; // TNetStrings attributes
        var cursor, colon; // parsing vars

        if (data instanceof Uint16Array)
            // data is already a view
            view = data;
        else
            // Transform the string to an array buffer
            for (cursor = 0; cursor < data.length; cursor++)
                view[cursor] = data.charCodeAt(cursor);

        // Find the colon position
        for (colon = 0; view[colon] != 58; colon++);

        // Simple cases
        if (colon === 1) {
            // null
            if (view[0] === 48)
                return {value: null, remain: this.remain(view, 3)};
            // true
            if (view[0] === 52 && view[6] === 33)
                return {value: true, remain: this.remain(view, 7)};
            // false
            if (view[0] === 53 && view[7] === 33)
                return {value: false, remain: this.remain(view, 8)};
        }

        size = this.decodeSize(view, colon);
        tag  = view[colon + size + 1];

        // Integers
        if (tag === 35) {
            return this.decodeInteger(view, colon, size);
        }

        // Floats
        if (tag === 94) {
            return this.decodeFloat(view, colon, size);
        }

        // Strings
        if (tag === 44) {
            return this.decodeString(view, colon, size);
        }

        // Lists
        if (tag === 93) {
            return this.decodeList(view, colon, size);
        }

        // Objects
        if (tag === 125) {
            return this.decodeObject(view, colon, size);
        }
    },

    decodeSize: function(view, colon) {
        var size       = 0;
        var cursor     = colon - 1;
        var multiplier = 1;
        for (; cursor >= 0; cursor--, multiplier *= 10)
            size += multiplier * (view[cursor] - 48);

        return size;
    },

    decodeInteger: function(view, colon, size) {
        var value      = 0;
        var cursor     = colon + size;
        var multiplier = 1;
        for (; cursor > colon; cursor--, multiplier *= 10)
            value += multiplier * (view[cursor] - 48);

        return {value: value, remain: this.remain(view, colon + size + 2)};
    },

    decodeFloat: function(view, colon, size) {
        var value      = 0;
        var decimal    = 0;
        var cursor     = colon + size;
        var multiplier = 1;
        for (; view[cursor] != 46; cursor--, multiplier *= 10)
            decimal += multiplier * (view[cursor] - 48);
        decimal = decimal/multiplier;

        cursor--;
        multiplier = 1
        for (; cursor > colon; cursor--, multiplier *= 10)
            value += multiplier * (view[cursor] - 48);

        return {value: value + decimal, remain: this.remain(view, colon + size + 2)};
    },

    decodeString: function(view, colon, size) {
        var offset = colon + 1;
        var v = new Uint16Array(size);

        for (var i = 0; i < size; i++)
            v[i] = view[i + offset];
        var value = String.fromCharCode.apply(null, v);

        offset += size + 1;
        return {value: value, remain: this.remain(view, offset)};
    },

    remain: function(view, offset) {
        var v = new Uint16Array(view.length - offset);
        for (var i = offset; i < view.length; i++)
            v[i - offset] = view[i];
        return String.fromCharCode.apply(null, v);
    },

    decodeList: function(view, colon, size) {
        var v = new Uint16Array(size);
        var list = [];

        for (var i = 0; i < size; i++)
            v[i] = view[i + colon + 1];

        var result = this.decode(v);
        list.push(result.value);
        while (result.remain != '') {
            result = this.decode(result.remain);
            list.push(result.value);
        }

        return {value: list, remain: this.remain(view, colon + size + 2)};
    },

    decodeObject: function(view, colon, size) {
        var v = new Uint16Array(size);
        var result, items = [], obj = {};

        for (var i = 0; i < size; i++)
            v[i] = view[i + colon + 1];

        result = this.decode(v);
        items.push(result.value);
        while (result.remain != '') {
            result = this.decode(result.remain);
            items.push(result.value);
        }

        for (var i = 0; i < items.length; i+=2)
            obj[items[i]] = items[i + 1];

        return {value: obj, remain: this.remain(view, colon + size + 2)};
    }
}

