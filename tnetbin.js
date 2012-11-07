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

        var type = typeof obj;
        var s = obj.toString();
        var tag;

        switch (type) {
        case 'string':
            tag = ',';
            break;
        case 'number':
            if (obj % 1 === 0)
                tag = '#';
            else
                tag = '^';
            break;
        case 'object':
            if (obj instanceof ArrayBuffer) {
                s = String.fromCharCode.apply(null, new Uint16Array(obj));
                tag = ',';
            } else if (obj instanceof Array) {
                s = obj.map(function(o) {
                    return tnetbin.encode(o);
                }).join('');
                tag = ']';
            }
        }

        return s.length + ':' + s + tag;
    }
}

