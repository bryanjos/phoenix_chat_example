function MatchError(message) {
  this.name = 'MatchError';
  this.message = message || 'No match for arguments given';
  this.stack = (new Error()).stack;
}

MatchError.prototype = Object.create(Error.prototype);
MatchError.prototype.constructor = MatchError;

const Type = {
  isSymbol: function(value) {
    return typeof x === 'symbol';
  },

  isAtom: function(value) {
    return !Type.isSymbol(value) && ((typeof value !== 'object' || value === null) &&
      typeof value !== 'function') ||
      Type.isBoolean(value) || Type.isNumber(value) || Type.isString(value);
  },

  isRegExp: function(value) {
    return (value.constructor.name === "RegExp" || value instanceof RegExp);
  },

  isNumber: function(value) {
    return (typeof value === 'number' || value instanceof Number) && !isNaN(value);
  },

  isString: function(value) {
    return typeof value === 'string' || value instanceof String;
  },

  isBoolean: function(value) {
    return value !== null &&
      (typeof value === 'boolean' || value instanceof Boolean);
  },

  isArray: function(value) {
    return Array.isArray(value);
  },

  isObject: function(value) {
    return Object.prototype.toString.apply(value) === '[object Object]';
  },

  isFunction: function(value) {
    return typeof value === 'function';
  },

  isDefined: function(value) {
    return typeof value !== 'undefined';
  },

  isUndefined: function(value) {
    return typeof value === 'undefined';
  },

  isWildcard: function(value) {
    return value &&
    value.constructor === _fun.wildcard.constructor;
  },

  isVariable: function(value) {
    return value &&
        typeof value === 'object' &&
        typeof value.is_variable === 'function' &&
        typeof value.get_name === 'function' &&
        value.is_variable();
  },

  isParameter: function(value){
    return value &&
    (value === _fun.parameter || value.constructor.name === _fun.parameter().constructor.name);
  },

  isStartsWith: function(value){
    return value &&
    value.constructor.name === _fun.startsWith().constructor.name;
  },

  isCapture: function(value) {
    return value &&
    value.constructor.name === _fun.capture().constructor.name;
  },

  isHeadTail: function(value) {
    return value.constructor === _fun.headTail.constructor;
  },

  isBound: function(value) {
    return value &&
    value.constructor.name === _fun.bound().constructor.name;
  }
};

let object = {
  extend: function(obj) {
    let i = 1, key,
      len = arguments.length;
    for (; i < len; i += 1) {
      for (key in arguments[i]) {
        // make sure we do not override built-in methods but toString and valueOf
        if (arguments[i].hasOwnProperty(key) &&
          (!obj[key] || obj.propertyIsEnumerable(key) || key === 'toString' || key === 'valueOf')) {
          obj[key] = arguments[i][key];
        }
      }
    }
    return obj;
  },

  filter: function(obj, fun, thisObj) {
    let key,
      r = {}, val;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        val = obj[key];
        if (fun.call(thisObj, val, key, obj)) {
          r[key] = val;
        }
      }
    }
    return r;
  },

  map: function(obj, fun, thisObj) {
    let key,
      r = {};
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        r[key] = fun.call(thisObj, obj[key], key, obj);
      }
    }
    return r;
  },

  forEach: function(obj, fun, thisObj) {
    let key;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        fun.call(thisObj, obj[key], key, obj);
      }
    }
  },

  every: function(obj, fun, thisObj) {
    let key;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key) && !fun.call(thisObj, obj[key], key, obj)) {
        return false;
      }
    }
    return true;
  },

  some: function(obj, fun, thisObj) {
    let key;
    thisObj = thisObj || obj;
    for (key in obj) {
      if (obj.hasOwnProperty(key) && fun.call(thisObj, obj[key], key, obj)) {
        return true;
      }
    }
    return false;
  },

  isEmpty: function(obj) {
    return object.every(obj, function(value, key) {
      return !obj.hasOwnProperty(key);
    });
  },

  values: function(obj) {
    let r = [];
    object.forEach(obj, function(value) {
      r.push(value);
    });
    return r;
  },

  keys: function(obj) {
    let r = [];
    object.forEach(obj, function(value, key) {
      r.push(key);
    });
    return r;
  },

  reduce: function(obj, fun, initial) {
    let key, initialKey;

    if (object.isEmpty(obj) && initial === undefined) {
      throw new TypeError();
    }
    if (initial === undefined) {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          initial = obj[key];
          initialKey = key;
          break;
        }
      }
    }
    for (key in obj) {
      if (obj.hasOwnProperty(key) && key !== initialKey) {
        initial = fun.call(null, initial, obj[key], key, obj);
      }
    }
    return initial;
  }
};

function buildMatch(pattern) {
  // A parameter can either be a function, or the result of invoking that
  // function so we need to check for both.
  if (Type.isUndefined(pattern) || Type.isWildcard(pattern)) {
    return matchWildcard(pattern);
  } else if(Type.isBound(pattern)) {
    return matchBound(pattern);
  } else if (Type.isParameter(pattern)) {
    return matchParameter(pattern);
  } else if (Type.isHeadTail(pattern)) {
    return matchHeadTail(pattern);
  } else if (Type.isStartsWith(pattern)) {
    return matchStartsWith(pattern);
  } else if (Type.isCapture(pattern)) {
    return matchCapture(pattern);
  } else if (Type.isAtom(pattern)) {
    return matchAtom(pattern);
  } else if (Type.isRegExp(pattern)) {
    return matchRegExp(pattern);
  } else if (Type.isObject(pattern)) {
    return matchObject(pattern);
  } else if (Type.isArray(pattern)) {
    return matchArray(pattern);
  } else if (Type.isFunction(pattern)) {
    return matchFunction(pattern);
  } else if (Type.isSymbol(pattern)) {
    return matchSymbol(pattern);
  }
}

function equals(one, two){
  if(typeof one !== typeof two){
    return false;
  }

  if(Type.isArray(one) || Type.isObject(one) || Type.isString(one)){
    if(one.length !== two.length){
      return false;
    }

    for(let i in one){
      if(!equals(one[i], two[i])){
        return false;
      }
    }

    return true;
  }

  return one === two;
}

function matchBound(pattern){
  return function(value, bindings){
    return equals(value, pattern.value) && bindings.push(value) > 0;
  };
}

function matchParameter(pattern){
  return function(value, bindings) {
    return bindings.push(value) > 0;
  };
}

function matchWildcard(pattern){
  return function() {
    return true;
  };
}

function matchHeadTail(patternHeadTail){
  return function(value, bindings) {
    return value.length > 1 &&
    bindings.push(value[0]) > 0 &&
    bindings.push(value.slice(1)) > 0;
  };
}

function matchCapture(patternCapture){
  let pattern = patternCapture.pattern;
  let subMatches = buildMatch(pattern);

  return function(value, bindings) {
    return subMatches(value, bindings) && bindings.push(value) > 0;
  };

}

function matchStartsWith(patternStartsWith) {
  let substr = patternStartsWith.substr;

  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    };
  }

  return function(value, bindings) {
    return Type.isString(substr) &&
      value.startsWith(substr) &&
      value.substring(substr.length) !== '' &&
      bindings.push(value.substring(substr.length)) > 0;
  };
}

function matchSymbol(patternSymbol) {
  let type = typeof patternSymbol,
    value = patternSymbol;

  return function(valueSymbol, bindings) {
    return (typeof valueSymbol === type && valueSymbol === value);
  };
}

function matchAtom(patternAtom) {
  let type = typeof patternAtom,
    value = patternAtom;

  return function(valueAtom, bindings) {
    return (typeof valueAtom === type && valueAtom === value) ||
      (typeof value === 'number' && isNaN(valueAtom) && isNaN(value));
  };
}

function matchRegExp(patternRegExp) {
  return function(value, bindings) {
    return !(typeof value === undefined) && typeof value === 'string' && patternRegExp.test(value);
  };
}

function matchFunction(patternFunction) {
  return function(value, bindings) {
    return value.constructor === patternFunction &&
      bindings.push(value) > 0;
  };
}

function matchArray(patternArray) {
  let patternLength = patternArray.length,
    subMatches = patternArray.map(function(value) {
      return buildMatch(value);
    });

  return function(valueArray, bindings) {
    return patternLength === valueArray.length &&
      valueArray.every(function(value, i) {
        return (i in subMatches) && subMatches[i](valueArray[i], bindings);
      });
  };
}

function matchObject(patternObject) {
  let type = patternObject.constructor,
    patternLength = 0,
    // Figure out the number of properties in the object
    // and the keys we need to check for. We put these
    // in another object so access is very fast. The build_match
    // function creates new subtests which we execute later.
    subMatches = object.map(patternObject, function(value) {
      patternLength += 1;
      return buildMatch(value);
    });

  // We then return a function which uses that information
  // to check against the object passed to it.
  return function(valueObject, bindings) {
    if(valueObject.constructor !== type){
      return false;
    }

    let newValueObject = {};

    for(let key of Object.keys(patternObject)){
      if(key in valueObject){
        newValueObject[key] = valueObject[key];
      }else{
        return false;
      }
    }

    // Checking the object type is very fast so we do it first.
    // Then we iterate through the value object and check the keys
    // it contains against the hash object we built earlier.
    // We also count the number of keys in the value object,
    // so we can also test against it as a final check.
    return object.every(newValueObject, function(value, key) {
        return ((key in subMatches) && subMatches[key](newValueObject[key], bindings));
      });
  };
}


var Match = {
  buildMatch
};

/**
 * @preserve jFun - JavaScript Pattern Matching v0.12
 *
 * Licensed under the new BSD License.
 * Copyright 2008, Bram Stein
 * All rights reserved.
 */
let _fun = function(...args) {
  let patterns = args.slice(0).map(function(value, i) {
    let pattern = {
      pattern: Match.buildMatch(value[0]),
      fn: value[1],
      guard: value.length === 3 ? value[2] : function() {
        return true;
      }
    };

    return pattern;
  });

  return function(...inner_args) {
    let value = inner_args.slice(0),
      result = [];

    for (let pattern of patterns) {
      if (pattern.pattern(value, result) && pattern.guard.apply(this, result)) {
        return pattern.fn.apply(this, result);
      }

      result = [];
    }
    // no matches were made so we throw an exception.
    throw new MatchError('No match for: ' + value);
  };
};

_fun.bind = function(pattern, expr){
  let result = [];
  let processedPattern = Match.buildMatch(pattern);
  if (processedPattern(expr, result)){
    return result;
  }else{
    throw new MatchError('No match for: ' + expr);
  }
};


_fun.parameter = function(name, orElse) {
  function Parameter(n, o) {
    this.name = n;
    this.orElse = o;
  }
  return new Parameter(name, orElse);
};

_fun.capture = function(pattern) {
  function Capture(p) {
    this.pattern = p;
  }
  return new Capture(pattern);
};

_fun.startsWith = function(substr) {
  function StartsWith(s) {
    this.substr = s;
  }

  return new StartsWith(substr);
};

_fun.wildcard = (function() {
  function Wildcard() {
  }
  return new Wildcard();
}());

_fun.headTail = (function() {
  function HeadTail() {
  }
  return new HeadTail();
}());

_fun.bound = function(value) {
  function Bound(v) {
    this.value = v;
  }

  return new Bound(value);
};

let BitString = {};

BitString.__MODULE__ = Symbol.for("BitString");

BitString.integer = function(value){
  return BitString.wrap(value, { 'type': 'integer', 'unit': 1, 'size': 8 });
};

BitString.float = function(value){
  return BitString.wrap(value, { 'type': 'float', 'unit': 1, 'size': 64 });
};

BitString.bitstring = function(value){
  return BitString.wrap(value, { 'type': 'bitstring', 'unit': 1, 'size': value.length });
};

BitString.bits = function(value){
  return BitString.bitstring(value);
};

BitString.binary = function(value){
  return BitString.wrap(value, { 'type': 'binary', 'unit': 8, 'size': value.length});
};

BitString.bytes = function(value){
  return BitString.binary(value);
};

BitString.utf8 = function(value){
  return BitString.wrap(value, { 'type': 'utf8' });
};

BitString.utf16 = function(value){
  return BitString.wrap(value, { 'type': 'utf16' });
};

BitString.utf32 = function(value){
  return BitString.wrap(value, { 'type': 'utf32' });
};

BitString.signed = function(value){
  return BitString.wrap(value, {}, 'signed');
};

BitString.unsigned = function(value){
  return BitString.wrap(value, {}, 'unsigned');
};

BitString.native = function(value){
  return BitString.wrap(value, {}, 'native');
};

BitString.big = function(value){
  return BitString.wrap(value, {}, 'big');
};

BitString.little = function(value){
  return BitString.wrap(value, {}, 'little');
};

BitString.size = function(value, count){
  return BitString.wrap(value, {'size': count});
};

BitString.unit = function(value, count){
  return BitString.wrap(value, {'unit': count});
};

BitString.wrap = function(value, opt, new_attribute = null){
  let the_value = value;

  if(!(value instanceof Object)){
    the_value = {'value': value, 'attributes': []};
  }

  the_value = Object.assign(the_value, opt);

  if(new_attribute){
    the_value.attributes.push(new_attribute);
  }


  return the_value;
};

BitString.toUTF8Array = function(str) {
  var utf8 = [];
  for (var i = 0; i < str.length; i++) {
    var charcode = str.charCodeAt(i);
    if (charcode < 0x80){
      utf8.push(charcode);
    }
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
    }
    else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                | (str.charCodeAt(i) & 0x3ff));
      utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
    }
  }
  return utf8;
};

BitString.toUTF16Array = function(str) {
  var utf16 = [];
  for (var i = 0; i < str.length; i++) {
    var codePoint = str.codePointAt(i);

    if(codePoint <= 255){
      utf16.push(0);
      utf16.push(codePoint);
    }else{
      utf16.push(((codePoint >> 8) & 0xFF));
      utf16.push((codePoint & 0xFF));
    }
  }
  return utf16;
};


BitString.toUTF32Array = function(str) {
  var utf32 = [];
  for (var i = 0; i < str.length; i++) {
    var codePoint = str.codePointAt(i);

    if(codePoint <= 255){
      utf32.push(0);
      utf32.push(0);
      utf32.push(0);
      utf32.push(codePoint);
    }else{
      utf32.push(0);
      utf32.push(0);
      utf32.push(((codePoint >> 8) & 0xFF));
      utf32.push((codePoint & 0xFF));
    }
  }
  return utf32;
};

//http://stackoverflow.com/questions/2003493/javascript-float-from-to-bits
BitString.float32ToBytes = function(f) {
  var bytes = [];

  var buf = new ArrayBuffer(4);
  (new Float32Array(buf))[0] = f;

  let intVersion = (new Uint32Array(buf))[0];

  bytes.push(((intVersion >> 24) & 0xFF));
  bytes.push(((intVersion >> 16) & 0xFF));
  bytes.push(((intVersion >> 8) & 0xFF));
  bytes.push((intVersion & 0xFF));

  return bytes;
};

BitString.float64ToBytes = function(f) {
  var bytes = [];

  var buf = new ArrayBuffer(8);
  (new Float64Array(buf))[0] = f;

  var intVersion1 = (new Uint32Array(buf))[0];
  var intVersion2 = (new Uint32Array(buf))[1];

  bytes.push(((intVersion2 >> 24) & 0xFF));
  bytes.push(((intVersion2 >> 16) & 0xFF));
  bytes.push(((intVersion2 >> 8) & 0xFF));
  bytes.push((intVersion2 & 0xFF));

  bytes.push(((intVersion1 >> 24) & 0xFF));
  bytes.push(((intVersion1 >> 16) & 0xFF));
  bytes.push(((intVersion1 >> 8) & 0xFF));
  bytes.push((intVersion1 & 0xFF));

  return bytes;
};

function atom (_value) {
  return Symbol.for(_value);
}

function list(...args){
  return Object.freeze(args);
}

function tuple(...args){
  return Object.freeze({__tuple__: Object.freeze(args) });
}

function bitstring(...args){
  if (!(this instanceof bitstring)){
    return new bitstring(...args);
  }

  this.raw_value = function(){
    return Object.freeze(args);
  };

  let _value = Object.freeze(this.process(args));

  this.value = function(){
    return _value;
  };

  this.length = _value.length;

  this.get = function(i){
    return _value[i];
  };

  return this;
}

bitstring.prototype[Symbol.iterator] = function () {
  return this.value()[Symbol.iterator]();
};

bitstring.prototype.toString = function(){
  var i, s = "";
  for (i = 0; i < this.length; i++) {
    if (s !== "") {
      s += ", ";
    }
    s += this.get(i).toString();
  }

  return "<<" + s + ">>";
};

bitstring.prototype.process = function(){
  let processed_values = [];

  var i;
  for (i = 0; i < this.raw_value().length; i++) {
    let processed_value = this['process_' + this.raw_value()[i].type](this.raw_value()[i]);

    for(let attr of this.raw_value()[i].attributes){
      processed_value = this['process_' + attr](processed_value);
    }

    processed_values = processed_values.concat(processed_value);
  }

  return processed_values;
};

bitstring.prototype.process_integer = function(value){
  return value.value;
};

bitstring.prototype.process_float = function(value){
  if(value.size === 64){
    return BitString.float64ToBytes(value.value);
  }else if(value.size === 32){
    return BitString.float32ToBytes(value.value);
  }

  throw new Error('Invalid size for float');
};

bitstring.prototype.process_bitstring = function(value){
  return value.value.value;
};

bitstring.prototype.process_binary = function(value){
  return BitString.toUTF8Array(value.value);
};

bitstring.prototype.process_utf8 = function(value){
  return BitString.toUTF8Array(value.value);
};

bitstring.prototype.process_utf16 = function(value){
  return BitString.toUTF16Array(value.value);
};

bitstring.prototype.process_utf32 = function(value){
  return BitString.toUTF32Array(value.value);
};

bitstring.prototype.process_signed = function(value){
  return (new Uint8Array([value]))[0];
};

bitstring.prototype.process_unsigned = function(value){
  return value;
};

bitstring.prototype.process_native = function(value){
  return value;
};

bitstring.prototype.process_big = function(value){
  return value;
};

bitstring.prototype.process_little = function(value){
  return value.reverse();
};

bitstring.prototype.process_size = function(value){
  return value;
};

bitstring.prototype.process_unit = function(value){
  return value;
};

let Erlang = {
  atom: atom,
  tuple: tuple,
  list: list,
  bitstring: bitstring
};

let Fetch = {};

Fetch.__MODULE__ = Erlang.atom("Fetch");

function make_request(url, method, options){
  options.method = method;
  return fetch(url, options);
}

Fetch.delete = function(url, options = {}){
  return make_request(url, "DELETE", options);
}

Fetch.get = function(url, options = {}){
  return make_request(url, "GET", options);
}

Fetch.head = function(url, options = {}){
  return make_request(url, "HEAD", options);
}

Fetch.options = function(url, options = {}){
  return make_request(url, "OPTIONS", options);
}

Fetch.post = function(url, options = {}){
  return make_request(url, "POST", options);
}

Fetch.put = function(url, options = {}){
  return make_request(url, "PUT", options);
}

let Tuple = {};

Tuple.__MODULE__ = Erlang.atom('Tuple');

Tuple.to_string = function(tuple){
  var i, s = "";
  for (i = 0; i < tuple.__tuple__.length; i++) {
    if (s !== "") {
      s += ", ";
    }
    s += tuple.__tuple__[i].toString();
  }

  return "{" + s + "}";
};

Tuple.delete_at = function(tuple, index){
  let new_list = [];

  for (var i = 0; i < tuple.__tuple__.length; i++) {
    if(i !== index){
      new_list.push(tuple.__tuple__[i]);
    }
  }

  return Erlang.tuple.apply(null, new_list);
};

Tuple.duplicate = function(data, size){
  let array = [];

  for (var i = size - 1; i >= 0; i--) {
    array.push(data);
  }

  return Erlang.tuple.apply(null, array);
};

Tuple.insert_at = function(tuple, index, term){
  let new_tuple = [];

  for (var i = 0; i <= tuple.__tuple__.length; i++) {
    if(i === index){
      new_tuple.push(term);
      i++;
      new_tuple.push(tuple.__tuple__[i]);
    }else{
      new_tuple.push(tuple.__tuple__[i]);
    }
  }

  return Erlang.tuple.apply(null, new_tuple);
};

Tuple.from_list = function(list){
  return Erlang.tuple.apply(null, list);
};

Tuple.to_list = function(tuple){
  let new_list = [];

  for (var i = 0; i < tuple.__tuple__.length; i++) {
    new_list.push(tuple.__tuple__[i]);
  }

  return Erlang.list(...new_list);
};

Tuple.iterator = function(tuple){
  return tuple.__tuple__[Symbol.iterator]();
};

let SpecialForms = {
  __MODULE__: Erlang.atom('SpecialForms'),

  __DIR__: function(){
    if(__dirname){
      return __dirname;
    }

    if(document.currentScript){
      return document.currentScript.src;
    }

    return null;
  },

  receive: function(receive_fun, timeout_in_ms = null, timeout_fn = (time) => true){
    if (timeout_in_ms == null || timeout_in_ms === System.for('infinity')) {
      while(true){
        if(self.mailbox.length !== 0){
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }
    }else if(timeout_in_ms === 0){
      if(self.mailbox.length !== 0){
        let message = self.mailbox[0];
        self.mailbox = self.mailbox.slice(1);
        return receive_fun(message);
      }else{
        return null;
      }
    }else{
      let now = Date.now();
      while(Date.now() < (now + timeout_in_ms)){
        if(self.mailbox.length !== 0){
          let message = self.mailbox[0];
          self.mailbox = self.mailbox.slice(1);
          return receive_fun(message);
        }
      }

      return timeout_fn(timeout_in_ms);
    }
  }
};

let Kernel = {
  __MODULE__: Erlang.atom('Kernel'),

  SpecialForms: SpecialForms,

  tl: function(list){
    return Erlang.list(...list.slice(1));
  },

  hd: function(list){
    return list[0];
  },

  is_nil: function(x){
    return x == null;
  },

  is_atom: function(x){
    return typeof x === 'symbol';
  },

  is_binary: function (x){
    return typeof x === 'string' || x instanceof String;
  },

  is_boolean: function (x){
    return typeof x === 'boolean' || x instanceof Boolean;
  },

  is_function: function(x, arity = -1){
    return typeof x === 'function' || x instanceof Function;
  },

  // from: http://stackoverflow.com/a/3885844
  is_float: function(x){
    return x === +x && x !== (x|0);
  },

  is_integer: function(x){
    return x === +x && x === (x|0);
  },

  is_list: function(x){
    return x instanceof Array;
  },

  is_map: function(x){
    return typeof x === 'object' || x instanceof Object && x.__tuple__ === null;
  },

  is_number: function(x){
    return Kernel.is_integer(x) || Kernel.is_float(x);
  },

  is_tuple: function(x){
    return (typeof x === 'object' || x instanceof Object) && x.__tuple__ !== null;
  },

  length: function(x){
    return x.length;
  },

  is_pid: function(x){
    return false;
  },

  is_port: function(x){

  },

  is_reference: function(x){

  },

  is_bitstring: function(x){
    return Kernel.is_binary(x) || x instanceof Erlang.bitstring;
  },

  __in__: function(left, right){
    for(let x of right){
      if(Kernel.match__qmark__(left, x)){
        return true;
      }
    }

    return false;
  },

  abs: function(number){
    return Math.abs(number);
  },

  round: function(number){
    return Math.round(number);
  },

  elem: function(tuple, index){
    if(Kernel.is_list(tuple)){
      return tuple[index];
    }

    return tuple.__tuple__[index];
  },

  rem: function(left, right){
    return left % right;
  },

  div: function(left, right){
    return left / right;
  },

  and: function(left, right){
    return left && right;
  },

  or: function(left, right){
    return left || right;
  },

  not: function(arg){
    return !arg;
  },

  apply: function(module, func, args){
    if(arguments.length === 3){
      return module[func].apply(null, args);
    }else{
      return module.apply(null, func);
    }
  },

  to_string: function(arg){
    if(Kernel.is_tuple(arg)){
      return Tuple.to_string(arg);
    }

    return arg.toString();
  },

  throw: function(e){
    throw e;
  },

  match__qmark__: function(pattern, expr, guard = () => true){
    try{
      let match = _fun([
        [pattern],
        function(){
          return true;
        },
        guard
      ]);

      return match(expr);
    }catch(e){
      return false;
    }
  }
};

let Atom = {};

Atom.__MODULE__ = Erlang.atom("Atom");

Atom.to_string = function (atom) {
  return Symbol.keyFor(atom);
};

Atom.to_char_list = function (atom) {
  return Atom.to_string(atom).split('');
};

let Enum = {
  __MODULE__: Erlang.atom('Enum'),

  all__qmark__: function(collection, fun = (x) => x){
    let result = Enum.filter(collection, function(x){
      return !fun(x);
    });

    return result === [];
  },

  any__qmark__: function(collection, fun = (x) => x){
    let result = Enum.filter(collection, function(x){
      return fun(x);
    });

    return result !== [];
  },

  at: function(collection, n, the_default = null){
    for (var i = 0; i < collection.length; i++) {
      if(i === n){
        return collection[i];
      }
    }

    return the_default;
  },

  concat: function(...enumables){
    return enumables[0].concat(enumables.slice(1));
  },

  count: function(collection, fun = null){
    if(fun == null){
      return Kernel.length(collection);
    }else{
      return Kernel.length(collection.filter(fun));
    }
  },

  each: function(collection, fun){
    [].forEach.call(collection, fun);
  },

  empty__qmark__: function(collection){
    return Kernel.length(collection) === 0;
  },

  fetch: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.length && n >= 0){
        return Erlang.tuple(Erlang.atom("ok"), collection[n]);
      }else{
        return Erlang.atom("error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  fetch__emark__: function(collection, n){
    if(Kernel.is_list(collection)){
      if(n < collection.length && n >= 0){
        return collection[n];
      }else{
        throw new Error("out of bounds error");
      }
    }

    throw new Error("collection is not an Enumerable");
  },

  filter: function(collection, fun){
    return [].filter.call(collection, fun);
  },

  map: function(collection, fun){
    return [].map.call(collection, fun);
  },

  map_reduce: function(collection, acc, fun){
    let mapped = Erlang.list();
    let the_acc = acc;

    for (var i = 0; i < collection.length; i++) {
      let tuple = fun(collection[i], the_acc);

      the_acc = Kernel.elem(tuple, 1);
      mapped = Erlang.list(...mapped.concat([Kernel.elem(tuple, 0)]));
    }

    return Erlang.tuple(mapped, the_acc);
  },

  member: function(collection, value){
    for(let x of collection){
      if(x === value){
        return true;
      }
    }

    return false;
  },

  reduce: function(collection, acc, fun){
    let the_acc = acc;

    for (var i = 0; i < collection.length; i++) {
      the_acc = fun(collection[i], the_acc);
    }

    return the_acc;
  }
};

let Integer = {
  __MODULE__: Erlang.atom('Integer'),

  is_even: function(n){
    return n % 2 === 0;
  },

  is_odd: function(n){
    return n % 2 !== 0;
  },

  parse: function(bin){
    let result = parseInt(bin);

    if(isNaN(result)){
      return Erlang.atom("error");
    }

    let indexOfDot = bin.indexOf(".");

    if(indexOfDot >= 0){
      return Erlang.tuple(result, bin.substring(indexOfDot));
    }

    return Erlang.tuple(result, "");
  },

  to_char_list: function(number, base = 10){
    return number.toString(base).split('');
  },

  to_string: function(number, base = 10){
    return number.toString(base);
  }
};

let JS = {
  __MODULE__: Erlang.atom('JS'),

  get_property_or_call_function: function(item, property){
    if(item[property] instanceof Function){
      return item[property]();
    }else{
      return item[property];
    }
  }
};

let List = {};

List.__MODULE__ = Erlang.atom('List');

List.delete = function(list, item){
  let new_value = [];
  let value_found = false;

  for(let x of list){
    if(x === item && value_found !== false){
      new_value.push(x);
      value_found = true;
    }else if(x !== item){
      new_value.push(x);
    }
  }

  return Erlang.list(...new_value);
};

List.delete_at = function(list, index){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i !== index){
      new_value.push(list[i]);
    }
  }

  return Erlang.list(...new_value);
};

List.duplicate = function(elem, n){
  let new_value = [];

  for (var i = 0; i < n; i++) {
    new_value.push(elem);
  }

  return Erlang.list(...new_value);
};

List.first = function(list){
  if(list.length === 0){
    return null;
  }

  return list[0];
};

List.flatten = function(list, tail = Erlang.list()){
  let new_value = [];

  for(let x of list){
    if(Kernel.is_list(x)){
      new_value = new_value.concat(List.flatten(x));
    }else{
      new_value.push(x);
    }
  }

  new_value = new_value.concat(tail);

  return Erlang.list(...new_value);
};

List.foldl = function(list, acc, func){
  let new_acc = acc;

  for(let x of list){
    new_acc = func(x, new_acc);
  }

  return new_acc;
};

List.foldr = function(list, acc, func){
  let new_acc = acc;

  for (var i = list.length - 1; i >= 0; i--) {
    new_acc = func(list[i], new_acc);
  }

  return new_acc;
};

List.insert_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(value);
      new_value.push(list[i]);
    }else{
      new_value.push(list[i]);
    }
  }

  return Erlang.list(...new_value);
};

List.keydelete = function(list, key, position){
  let new_list = [];

  for(let i = 0; i < list.length; i++){
    if(!Kernel.match__qmark__(list[i][position], key)){
      new_list.push(list[i]);
    }
  }

  return Erlang.list(...new_list);
};

List.keyfind = function(list, key, position, _default = null){

  for(let i = 0; i < list.length; i++){
    if(Kernel.match__qmark__(list[i][position], key)){
      return list[i];
    }
  }

  return _default;
};

List.keymember__qmark__ = function(list, key, position){

  for(let i = 0; i < list.length; i++){
    if(Kernel.match__qmark__(list[i][position], key)){
      return true;
    }
  }

  return false;
};

List.keyreplace = function(list, key, position, new_tuple){
  let new_list = [];

  for(let i = 0; i < list.length; i++){
    if(!Kernel.match__qmark__(list[i][position], key)){
      new_list.push(list[i]);
    }else{
      new_list.push(new_tuple);
    }
  }

  return Erlang.list(...new_list);
};


List.keysort = function(list, position){
  let new_list = list;

  new_list.sort(function(a, b){
    if(position === 0){
      if(a[position].value < b[position].value){
        return -1;
      }

      if(a[position].value > b[position].value){
        return 1;
      }

      return 0;
    }else{
      if(a[position] < b[position]){
        return -1;
      }

      if(a[position] > b[position]){
        return 1;
      }

      return 0;
    }

  });

  return Erlang.list(...new_list);
};

List.keystore = function(list, key, position, new_tuple){
  let new_list = [];
  let replaced = false;

  for(let i = 0; i < list.length; i++){
    if(!Kernel.match__qmark__(list[i][position], key)){
      new_list.push(list[i]);
    }else{
      new_list.push(new_tuple);
      replaced = true;
    }
  }

  if(!replaced){
    new_list.push(new_tuple);
  }

  return Erlang.list(...new_list);
};

List.last = function(list){
  if(list.length === 0){
    return null;
  }

  return list[list.length - 1];
};

List.replace_at = function(list, index, value){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(value);
    }else{
      new_value.push(list[i]);
    }
  }

  return Erlang.list(...new_value);
};

List.update_at = function(list, index, fun){
  let new_value = [];

  for(let i = 0; i < list.length; i++){
    if(i === index){
      new_value.push(fun(list[i]));
    }else{
      new_value.push(list[i]);
    }
  }

  return new_value;
};

List.wrap = function(list){
  if(Kernel.is_list(list)){
    return list;
  }else if(list == null){
    return Erlang.list();
  }else{
    return Erlang.list(list);
  }
};

List.zip = function(list_of_lists){
  if(list_of_lists.length === 0){
    return Erlang.list();
  }

  let new_value = [];
  let smallest_length = list_of_lists[0];

  for(let x of list_of_lists){
    if(x.length < smallest_length){
      smallest_length = x.length;
    }
  }

  for(let i = 0; i < smallest_length; i++){
    let current_value = [];
    for(let j = 0; j < list_of_lists.length; j++){
      current_value.push(list_of_lists[j][i]);
    }

    new_value.push(Erlang.tuple(...current_value));
  }

  return Erlang.list(...new_value);
};

List.to_tuple = function(list){
  return Erlang.tuple.apply(null, list);
};

List.append = function(list, value){
  return Erlang.list(...list.concat([value]));
};

List.concat = function(left, right){
  return Erlang.list(...left.concat(right));
};

let Range = function(_first, _last){
  if (!(this instanceof Range)){
    return new Range(_first, _last);
  }

  this.first = function(){
    return _first;
  };

  this.last = function(){
    return _last;
  };

  let _range = [];

  for(let i = _first; i <= _last; i++){
    _range.push(i);
  }

  _range = Object.freeze(_range);

  this.value = function(){
    return _range;
  };

  this.length = function(){
    return _range.length;
  };

  return this;
};

Range.__MODULE__ = Erlang.atom('Range');

Range.prototype[Symbol.iterator] = function(){
  return this.value()[Symbol.iterator]();
};

Range.new = function (first, last) {
  return Range(first, last);
};

Range.range__qmark__ = function (range) {
  return range instanceof Range;
};

let Keyword = {};

Keyword.__MODULE__ = Erlang.atom("Keyword");

Keyword.has_key__qm__ = function(keywords, key){
  for(let keyword of keywords){
    if(Kernel.elem(keyword, 0) == key){
      return true;
    }
  }

  return false;
}

Keyword.get = function(keywords, key, the_default = null){
  for(let keyword of keywords){
    if(Kernel.elem(keyword, 0) == key){
      return Kernel.elem(keyword, 1);
    }
  }

  return the_default;
}

let Agent = {};

Agent.__MODULE__ = Erlang.atom("Agent");

Agent.start = function(fun, options = []){
  const name = Keyword.has_key__qm__(options, Erlang.atom("name")) ? Keyword.get(options, Erlang.atom("name")) : Symbol();
  self.mailbox[name] = fun();
  return Erlang.tuple(Erlang.atom("ok"), name);
}

Agent.stop = function(agent, timeout = 5000){
  delete self.mailbox[agent];
  return Erlang.atom("ok");
}

Agent.update = function(agent, fun, timeout = 5000){
  const new_state = fun(self.mailbox[agent]);
  self.mailbox[agent] = new_state;
  return Erlang.atom("ok");
}

Agent.get = function(agent, fun, timeout = 5000){
  return fun(self.mailbox[agent]);
}

Agent.get_and_update = function(agent, fun, timeout = 5000){
  const get_and_update_tuple = fun(self.mailbox[agent]);
  
  self.mailbox[agent] = Kernel.elem(get_and_update_tuple, 1);
  return Kernel.elem(get_and_update_tuple, 0);
}

self.mailbox = self.mailbox || {};

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.virtualDom=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var createElement = require("./vdom/create-element.js")

module.exports = createElement

},{"./vdom/create-element.js":15}],2:[function(require,module,exports){
var diff = require("./vtree/diff.js")

module.exports = diff

},{"./vtree/diff.js":35}],3:[function(require,module,exports){
var h = require("./virtual-hyperscript/index.js")

module.exports = h

},{"./virtual-hyperscript/index.js":22}],4:[function(require,module,exports){
var diff = require("./diff.js")
var patch = require("./patch.js")
var h = require("./h.js")
var create = require("./create-element.js")
var VNode = require('./vnode/vnode.js')
var VText = require('./vnode/vtext.js')

module.exports = {
    diff: diff,
    patch: patch,
    h: h,
    create: create,
    VNode: VNode,
    VText: VText
}

},{"./create-element.js":1,"./diff.js":2,"./h.js":3,"./patch.js":13,"./vnode/vnode.js":31,"./vnode/vtext.js":33}],5:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
'use strict';

var OneVersionConstraint = require('individual/one-version');

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

module.exports = EvStore;

function EvStore(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

},{"individual/one-version":9}],8:[function(require,module,exports){
(function (global){
'use strict';

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual;

function Individual(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
'use strict';

var Individual = require('./index.js');

module.exports = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

},{"./index.js":8}],10:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":6}],11:[function(require,module,exports){
"use strict";

module.exports = function isObject(x) {
  return typeof x === "object" && x !== null;
};

},{}],12:[function(require,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],13:[function(require,module,exports){
var patch = require("./vdom/patch.js")

module.exports = patch

},{"./vdom/patch.js":18}],14:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook.js")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous)
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined)
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue)
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

},{"../vnode/is-vhook.js":26,"is-object":11}],15:[function(require,module,exports){
var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("../vnode/is-vnode.js")
var isVText = require("../vnode/is-vtext.js")
var isWidget = require("../vnode/is-widget.js")
var handleThunk = require("../vnode/handle-thunk.js")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vnode/handle-thunk.js":24,"../vnode/is-vnode.js":27,"../vnode/is-vtext.js":28,"../vnode/is-widget.js":29,"./apply-properties":14,"global/document":10}],16:[function(require,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],17:[function(require,module,exports){
var applyProperties = require("./apply-properties")

var isWidget = require("../vnode/is-widget.js")
var VPatch = require("../vnode/vpatch.js")

var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = renderOptions.render(vText, renderOptions)

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget)
    var newNode

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode
    } else {
        newNode = renderOptions.render(widget, renderOptions)
    }

    var parentNode = domNode.parentNode

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode)
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = renderOptions.render(vNode, renderOptions)

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes
    var keyMap = {}
    var node
    var remove
    var insert

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i]
        node = childNodes[remove.from]
        if (remove.key) {
            keyMap[remove.key] = node
        }
        domNode.removeChild(node)
    }

    var length = childNodes.length
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j]
        node = keyMap[insert.key]
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to])
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

},{"../vnode/is-widget.js":29,"../vnode/vpatch.js":32,"./apply-properties":14,"./update-widget":19}],18:[function(require,module,exports){
var document = require("global/document")
var isArray = require("x-is-array")

var render = require("./create-element")
var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {}
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch
        ? renderOptions.patch
        : patchRecursive
    renderOptions.render = renderOptions.render || render

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./create-element":15,"./dom-index":16,"./patch-op":17,"global/document":10,"x-is-array":12}],19:[function(require,module,exports){
var isWidget = require("../vnode/is-widget.js")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vnode/is-widget.js":29}],20:[function(require,module,exports){
'use strict';

var EvStore = require('ev-store');

module.exports = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

},{"ev-store":7}],21:[function(require,module,exports){
'use strict';

module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],22:[function(require,module,exports){
'use strict';

var isArray = require('x-is-array');

var VNode = require('../vnode/vnode.js');
var VText = require('../vnode/vtext.js');
var isVNode = require('../vnode/is-vnode');
var isVText = require('../vnode/is-vtext');
var isWidget = require('../vnode/is-widget');
var isHook = require('../vnode/is-vhook');
var isVThunk = require('../vnode/is-thunk');

var parseTag = require('./parse-tag.js');
var softSetHook = require('./hooks/soft-set-hook.js');
var evHook = require('./hooks/ev-hook.js');

module.exports = h;

function h(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode)
        '\n' +
        'Suggested fix: change your `h(..., [ ... ])` callsite.';
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

},{"../vnode/is-thunk":25,"../vnode/is-vhook":26,"../vnode/is-vnode":27,"../vnode/is-vtext":28,"../vnode/is-widget":29,"../vnode/vnode.js":31,"../vnode/vtext.js":33,"./hooks/ev-hook.js":20,"./hooks/soft-set-hook.js":21,"./parse-tag.js":23,"x-is-array":12}],23:[function(require,module,exports){
'use strict';

var split = require('browser-split');

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

module.exports = parseTag;

function parseTag(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

},{"browser-split":5}],24:[function(require,module,exports){
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

},{"./is-thunk":25,"./is-vnode":27,"./is-vtext":28,"./is-widget":29}],25:[function(require,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],26:[function(require,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

},{}],27:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":30}],28:[function(require,module,exports){
var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":30}],29:[function(require,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],30:[function(require,module,exports){
module.exports = "2"

},{}],31:[function(require,module,exports){
var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var hasThunks = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        } else if (!hasThunks && isThunk(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hasThunks = hasThunks
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-thunk":25,"./is-vhook":26,"./is-vnode":27,"./is-widget":29,"./version":30}],32:[function(require,module,exports){
var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":30}],33:[function(require,module,exports){
var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":30}],34:[function(require,module,exports){
var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) {
            continue
        } else if (isObject(aValue) && isObject(bValue)) {
            if (getPrototype(bValue) !== getPrototype(aValue)) {
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else {
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) {
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else {
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

},{"../vnode/is-vhook":26,"is-object":11}],35:[function(require,module,exports){
var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0
    var freeCount = bFree.length
    var deletedItems = 0

    // Iterate through a and match a node in b
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex

        if (aItem.key) {
            if (bKeys.hasOwnProperty(aItem.key)) {
                // Match up the old keys
                itemIndex = bKeys[aItem.key]
                newChildren.push(bChildren[itemIndex])

            } else {
                // Remove old keyed items
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        } else {
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else {
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }
        }
    }

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // Iterate through b and append any new keys
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) {
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"../vnode/handle-thunk":24,"../vnode/is-thunk":25,"../vnode/is-vnode":27,"../vnode/is-vtext":28,"../vnode/is-widget":29,"../vnode/vpatch":32,"./diff-props":34,"x-is-array":12}]},{},[4])(4)
});

export { virtualDom, _fun as fun, Fetch, Erlang, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword };