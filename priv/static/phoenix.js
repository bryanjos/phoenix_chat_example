// Generated by CoffeeScript 1.7.1
(function() {
  this.Phoenix = {};

  this.Phoenix.Channel = (function() {
    Channel.prototype.bindings = null;

    function Channel(channel, topic, message, callback, socket) {
      this.channel = channel;
      this.topic = topic;
      this.message = message;
      this.callback = callback;
      this.socket = socket;
      this.reset();
    }

    Channel.prototype.reset = function() {
      return this.bindings = [];
    };

    Channel.prototype.on = function(event, callback) {
      return this.bindings.push({
        event: event,
        callback: callback
      });
    };

    Channel.prototype.isMember = function(channel, topic) {
      return this.channel === channel && this.topic === topic;
    };

    Channel.prototype.off = function(event) {
      var bind;
      return this.bindings = (function() {
        var _i, _len, _ref, _results;
        _ref = this.bindings;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bind = _ref[_i];
          if (bind.event !== event) {
            _results.push(bind);
          }
        }
        return _results;
      }).call(this);
    };

    Channel.prototype.trigger = function(triggerEvent, msg) {
      var callback, event, _i, _len, _ref, _ref1, _results;
      _ref = this.bindings;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], event = _ref1.event, callback = _ref1.callback;
        if (event === triggerEvent) {
          _results.push(callback(msg));
        }
      }
      return _results;
    };

    Channel.prototype.send = function(event, message) {
      return this.socket.send({
        channel: this.channel,
        topic: this.topic,
        event: event,
        message: message
      });
    };

    return Channel;

  })();

  this.Phoenix.Socket = (function() {
    Socket.prototype.conn = null;

    Socket.prototype.endPoint = null;

    Socket.prototype.channels = null;

    Socket.prototype.sendBuffer = null;

    Socket.prototype.sendBufferTimer = null;

    Socket.prototype.flushEveryMs = 50;

    Socket.prototype.reconnectTimer = null;

    Socket.prototype.reconnectAfterMs = 1000;

    function Socket(endPoint) {
      this.endPoint = endPoint;
      this.channels = [];
      this.sendBuffer = [];
      this.resetBufferTimer();
      this.reconnect();
    }

    Socket.prototype.reconnect = function() {
      this.conn = new WebSocket(this.endPoint);
      this.conn.onopen = (function(_this) {
        return function() {
          return _this.onOpen();
        };
      })(this);
      this.conn.onerror = (function(_this) {
        return function(error) {
          return _this.onError(error);
        };
      })(this);
      this.conn.onmessage = (function(_this) {
        return function(event) {
          return _this.onMessage(event);
        };
      })(this);
      return this.conn.onclose = (function(_this) {
        return function(event) {
          return _this.onClose(event);
        };
      })(this);
    };

    Socket.prototype.resetBufferTimer = function() {
      clearTimeout(this.sendBufferTimer);
      return this.sendBufferTimer = setTimeout(((function(_this) {
        return function() {
          return _this.flushSendBuffer();
        };
      })(this)), this.flushEveryMs);
    };

    Socket.prototype.onOpen = function() {
      clearTimeout(this.reconnectTimer);
      return this.rejoinAll();
    };

    Socket.prototype.onClose = function(event) {
      console.log("WS: " + event);
      clearTimeout(this.reconnectTimer);
      return this.reconnectTimer = setTimeout(((function(_this) {
        return function() {
          return _this.reconnect();
        };
      })(this)), this.reconnectAfterMs);
    };

    Socket.prototype.onError = function(error) {
      return typeof console.log === "function" ? console.log("WS: " + error) : void 0;
    };

    Socket.prototype.connectionState = function() {
      switch (this.conn.readyState) {
        case 0:
          return "connecting";
        case 1:
          return "open";
        case 2:
          return "closing";
        case 3:
          return "closed";
      }
    };

    Socket.prototype.isConnected = function() {
      return this.connectionState() === "open";
    };

    Socket.prototype.rejoinAll = function() {
      var chan, _i, _len, _ref, _results;
      _ref = this.channels;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        chan = _ref[_i];
        _results.push(this.rejoin(chan));
      }
      return _results;
    };

    Socket.prototype.rejoin = function(chan) {
      var channel, message, topic;
      chan.reset();
      channel = chan.channel, topic = chan.topic, message = chan.message;
      this.send({
        channel: channel,
        topic: topic,
        event: "join",
        message: message
      });
      return chan.callback(chan);
    };

    Socket.prototype.join = function(channel, topic, message, callback) {
      var chan;
      chan = new Phoenix.Channel(channel, topic, message, callback, this);
      this.channels.push(chan);
      if (this.isConnected()) {
        return this.rejoin(chan);
      }
    };

    Socket.prototype.unjoin = function(channel, topic) {
      var c;
      return this.channels = (function() {
        var _i, _len, _ref, _results;
        _ref = this.channels;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          c = _ref[_i];
          if (!(c.isMember(channel, topic))) {
            _results.push(c);
          }
        }
        return _results;
      }).call(this);
    };

    Socket.prototype.send = function(data) {
      var callback;
      callback = (function(_this) {
        return function() {
          return _this.conn.send(JSON.stringify(data));
        };
      })(this);
      if (this.isConnected()) {
        return callback();
      } else {
        return this.sendBuffer.push(callback);
      }
    };

    Socket.prototype.flushSendBuffer = function() {
      var callback, _i, _len, _ref;
      if (this.isConnected() && this.sendBuffer.length > 0) {
        _ref = this.sendBuffer;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          callback = _ref[_i];
          callback();
        }
        this.sendBuffer = [];
      }
      return this.resetBufferTimer();
    };

    Socket.prototype.onMessage = function(rawMessage) {
      var chan, channel, event, message, topic, _i, _len, _ref, _ref1, _results;
      console.log(rawMessage);
      _ref = JSON.parse(rawMessage.data), channel = _ref.channel, topic = _ref.topic, event = _ref.event, message = _ref.message;
      _ref1 = this.channels;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        chan = _ref1[_i];
        if (chan.isMember(channel, topic)) {
          _results.push(chan.trigger(event, message));
        }
      }
      return _results;
    };

    return Socket;

  })();

}).call(this);
