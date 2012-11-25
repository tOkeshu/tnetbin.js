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
            if (view[0] === 52 && view[6] === 33)
                return true;
            if (view[0] === 53 && view[7] === 33)
                return false;
        }
        return null;
    }
}

