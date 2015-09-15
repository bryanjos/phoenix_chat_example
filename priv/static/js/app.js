System.register(['js/elixir', 'js/phoenix/phoenix', 'jquery'], function (_export) {
  'use strict';

  var fun, Erlang, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString, Socket, LongPoller, JQuery, __MODULE__, sanitize, messageTemplate, init;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  return {
    setters: [function (_jsElixir) {
      fun = _jsElixir.fun;
      Erlang = _jsElixir.Erlang;
      Kernel = _jsElixir.Kernel;
      Atom = _jsElixir.Atom;
      Enum = _jsElixir.Enum;
      Integer = _jsElixir.Integer;
      JS = _jsElixir.JS;
      List = _jsElixir.List;
      Range = _jsElixir.Range;
      Tuple = _jsElixir.Tuple;
      Agent = _jsElixir.Agent;
      Keyword = _jsElixir.Keyword;
      BitString = _jsElixir.BitString;
    }, function (_jsPhoenixPhoenix) {
      Socket = _jsPhoenixPhoenix.Socket;
      LongPoller = _jsPhoenixPhoenix.LongPoller;
    }, function (_jquery) {
      JQuery = _jquery['default'];
    }],
    execute: function () {
      __MODULE__ = Erlang.atom('App');
      sanitize = fun([[fun.parameter], function (html) {
        return JS.get_property_or_call_function(JQuery('<div/>').text(html), 'html');
      }]);
      messageTemplate = fun([[fun.parameter], function (msg) {
        var _fun$bind = fun.bind(fun.parameter, sanitize(JS.get_property_or_call_function(msg, 'user') || 'anonymous'));

        var _fun$bind2 = _slicedToArray(_fun$bind, 1);

        var username0 = _fun$bind2[0];

        var _fun$bind3 = fun.bind(fun.parameter, sanitize(JS.get_property_or_call_function(msg, 'body')));

        var _fun$bind32 = _slicedToArray(_fun$bind3, 1);

        var body0 = _fun$bind32[0];

        return '<p><a href="#">[' + (Kernel.to_string(username0) + (']</a>&nbsp; ' + (Kernel.to_string(body0) + '</p>\n')));
      }]);
      init = fun([[], function () {
        var _fun$bind4 = fun.bind(fun.parameter, new Socket('/socket', _defineProperty({}, 'logger', fun([[fun.parameter, fun.parameter, fun.parameter], function (kind, msg, data) {
          return console.debug(Kernel.to_string(kind) + (': ' + Kernel.to_string(msg)), data);
        }]))));

        var _fun$bind42 = _slicedToArray(_fun$bind4, 1);

        var socket0 = _fun$bind42[0];

        socket0.connect(_defineProperty({}, 'user_id', '123'));

        var _fun$bind5 = fun.bind(fun.parameter, JQuery('#status'));

        var _fun$bind52 = _slicedToArray(_fun$bind5, 1);

        var status0 = _fun$bind52[0];

        var _fun$bind6 = fun.bind(fun.parameter, JQuery('#messages'));

        var _fun$bind62 = _slicedToArray(_fun$bind6, 1);

        var messages0 = _fun$bind62[0];

        var _fun$bind7 = fun.bind(fun.parameter, JQuery('#message-input'));

        var _fun$bind72 = _slicedToArray(_fun$bind7, 1);

        var input0 = _fun$bind72[0];

        var _fun$bind8 = fun.bind(fun.parameter, JQuery('#username'));

        var _fun$bind82 = _slicedToArray(_fun$bind8, 1);

        var username0 = _fun$bind82[0];

        socket0.onOpen(fun([[], function () {
          return console.debug('OPEN');
        }]));
        socket0.onError(fun([[], function () {
          return console.debug('ERROR');
        }]));
        socket0.onClose(fun([[], function () {
          return console.debug('CLOSE');
        }]));

        var _fun$bind9 = fun.bind(fun.parameter, socket0.channel('rooms:lobby', {}));

        var _fun$bind92 = _slicedToArray(_fun$bind9, 1);

        var chan0 = _fun$bind92[0];

        JS.get_property_or_call_function(chan0, 'join').receive('ignore', fun([[fun.parameter], function (msg) {
          return console.error('auth error');
        }])).receive('ok', fun([[fun.parameter], function (msg) {
          return console.info('join ok');
        }])).after(10000, fun([[], function () {
          return console.info('Connection interruption');
        }]));
        chan0.onError(fun([[fun.parameter], function (e) {
          return console.log('Something went wrong', e);
        }]));
        chan0.onClose(fun([[fun.parameter], function (e) {
          return console.log('channel closed', e);
        }]));
        input0.off('keypress').on('keypress', fun([[fun.parameter], function (e) {
          return fun([[fun.parameter], function (x) {
            return null;
          }, function (x) {
            return Kernel.__in__(x, Erlang.list(false, null));
          }], [[fun.wildcard], function () {
            var _chan0$push;

            chan0.push('new:msg', (_chan0$push = {}, _defineProperty(_chan0$push, 'user', JS.get_property_or_call_function(username0, 'val')), _defineProperty(_chan0$push, 'body', JS.get_property_or_call_function(input0, 'val')), _chan0$push));
            return input0.val('');
          }]).call(this, JS.get_property_or_call_function(e, 'keyCode') == 13);
        }]));
        chan0.on('new:msg', fun([[fun.parameter, fun.wildcard], function (msg) {
          messages0.append(messageTemplate(msg));
          return scrollTo(0, JS.get_property_or_call_function(JS.get_property_or_call_function(document, 'body'), 'scrollHeight'));
        }]));
        return chan0.on('user:entered', fun([[fun.parameter, fun.wildcard], function (msg) {
          var _fun$bind10 = fun.bind(fun.parameter, sanitize(JS.get_property_or_call_function(msg, 'user') || 'anonymous'));

          var _fun$bind102 = _slicedToArray(_fun$bind10, 1);

          var username10 = _fun$bind102[0];

          return messages0.append('<br/><i>[' + (Kernel.to_string(username10) + ' entered]</i>'));
        }]));
      }]);

      init();

      _export('init', init);
    }
  };
});