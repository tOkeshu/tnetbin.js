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
        var ctx = {}, stack = [], current; // parsing vars

        // Transform the string to an array buffer
        for (ctx.cursor = 0; ctx.cursor < data.length; ctx.cursor++)
            view[ctx.cursor] = data.charCodeAt(ctx.cursor);

        ctx.cursor = 0;
        do {
            if (view[ctx.cursor] === 93) {
                if (stack.length > 0) {
                    stack[stack.length - 1].push(current);
                    current = stack.pop();
                } else {
                    break;
                }
                ctx.cursor ++;
                continue
            }

            if (view[ctx.cursor] === 125) {
                items = current;
                current = {};
                for (var j = 0; j < items.length; j+=2)
                    current[items[j]] = items[j + 1];

                if (stack.length > 0) {
                    stack[stack.length - 1].push(current);
                    current = stack.pop();
                } else {
                    break;
                }

                ctx.cursor++;
                continue;
            }

            size = this.decodeSize(view, ctx);
            tag  = view[ctx.cursor + size + 1];

            if (tag == 126 || tag === 33 || tag === 35 || tag === 94 || tag === 44) {
                switch (tag) {
                case 126:
                    payload = null;
                    break;
                case 33:
                    payload = (size === 4) ? true : false;
                    break;
                case 35:
                    payload = this.decodeInteger(view, ctx.cursor + 1, ctx.cursor + size + 1);
                    break;
                case 94:
                    payload = this.decodeFloat(view, ctx.cursor + 1, size);
                    break;
                case 44:
                    payload = this.decodeString(view, ctx.cursor + 1, size);
                }

                ctx.cursor = ctx.cursor + size + 2;

                if (current)
                    current.push(payload);
                else {
                    current = payload;
                    break;
                }
            } else if (tag === 93 || tag === 125) {
                if (current)
                    stack.push(current);
                current = [];
                ctx.cursor++;
            }
        } while(ctx.cursor < view.length);

        return {value: current, remain: this.remain(view, ctx.cursor)};
    },

    decodeSize: function(view, ctx) {
        for(var size=0; view[ctx.cursor] != 58; ctx.cursor++)
            size = size*10 + (view[ctx.cursor] - 48);

        return size;
    },

    decodeInteger: function(view, start, end) {
        for(var value=0, cursor=start; cursor < end; cursor++)
            value = value*10 + (view[cursor] - 48);

        return value;
    },

    decodeFloat: function(view, start, size) {
        var value, decimal, exp, cursor, end;
        value = decimal = 0;

        for(cursor=start; view[cursor] != 46; cursor++)
            value = value*10 + (view[cursor] - 48);

        cursor++;
        for (end=start+size, exp=1; cursor < end; cursor++, exp*=10) {
            decimal = decimal*10 + (view[cursor] - 48);
        }

        decimal = decimal/exp;
        value += decimal;
        return value;
    },

    decodeString: function(view, start, size) {
        var v = new Uint16Array(size);

        for (var i = 0; i < size; i++)
            v[i] = view[i + start];
        var value = String.fromCharCode.apply(null, v);

        return value;
    },

    remain: function(view, offset) {
        var v = new Uint16Array(view.length - offset);
        for (var i = offset; i < view.length; i++)
            v[i - offset] = view[i];
        return String.fromCharCode.apply(null, v);
    }
}

