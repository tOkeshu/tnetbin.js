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
            tag = ','
            break;
        case 'number':
            if (obj % 1 === 0)
                tag = '#';
            else
                tag = '^'
        }

        return s.length + ':' + s + tag;
    }
}

