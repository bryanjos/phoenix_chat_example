    import { fun, Erlang, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'js/elixir';
    import { Socket, LongPoller } from 'js/phoenix/phoenix';
    import { default as JQuery } from 'jquery';
    const __MODULE__ = Erlang.atom('App');
    let sanitize = fun([[fun.parameter], function(html)    {
        return     JS.get_property_or_call_function(JQuery('<div/>').text(html),'html');
      }]);
    let messageTemplate = fun([[fun.parameter], function(msg)    {
        let [username0] = fun.bind(fun.parameter,sanitize(JS.get_property_or_call_function(msg,'user') || 'anonymous'));
        let [body0] = fun.bind(fun.parameter,sanitize(JS.get_property_or_call_function(msg,'body')));
        return     '<p><a href="#">[' + (Kernel.to_string(username0) + (']</a>&nbsp; ' + (Kernel.to_string(body0) + '</p>\n')));
      }]);
    let init = fun([[], function()    {
        let [socket0] = fun.bind(fun.parameter,new Socket('/socket',{
        ['logger']: fun([[fun.parameter, fun.parameter, fun.parameter], function(kind,msg,data)    {
        return     console.debug(Kernel.to_string(kind) + (': ' + Kernel.to_string(msg)),data);
      }])
  }));
        socket0.connect({
        ['user_id']: '123'
  });
        let [status0] = fun.bind(fun.parameter,JQuery('#status'));
        let [messages0] = fun.bind(fun.parameter,JQuery('#messages'));
        let [input0] = fun.bind(fun.parameter,JQuery('#message-input'));
        let [username0] = fun.bind(fun.parameter,JQuery('#username'));
        socket0.onOpen(fun([[], function()    {
        return     console.debug('OPEN');
      }]));
        socket0.onError(fun([[], function()    {
        return     console.debug('ERROR');
      }]));
        socket0.onClose(fun([[], function()    {
        return     console.debug('CLOSE');
      }]));
        let [chan0] = fun.bind(fun.parameter,socket0.channel('rooms:lobby',{}));
        JS.get_property_or_call_function(chan0,'join').receive('ignore',fun([[fun.parameter], function(msg)    {
        return     console.error('auth error');
      }])).receive('ok',fun([[fun.parameter], function(msg)    {
        return     console.info('join ok');
      }])).after(10000,fun([[], function()    {
        return     console.info('Connection interruption');
      }]));
        chan0.onError(fun([[fun.parameter], function(e)    {
        return     console.log('Something went wrong',e);
      }]));
        chan0.onClose(fun([[fun.parameter], function(e)    {
        return     console.log('channel closed',e);
      }]));
        input0.off('keypress').on('keypress',fun([[fun.parameter], function(e)    {
        return     fun([[fun.parameter], function(x)    {
        return     null;
      }, function(x)    {
        return     Kernel.__in__(x,Erlang.list(false,null));
      }],[[fun.wildcard], function()    {
        chan0.push('new:msg',{
        ['user']: JS.get_property_or_call_function(username0,'val'),     ['body']: JS.get_property_or_call_function(input0,'val')
  });
        return     input0.val('');
      }]).call(this,JS.get_property_or_call_function(e,'keyCode') == 13);
      }]));
        chan0.on('new:msg',fun([[fun.parameter, fun.wildcard], function(msg)    {
        messages0.append(messageTemplate(msg));
        return     scrollTo(0,JS.get_property_or_call_function(JS.get_property_or_call_function(document,'body'),'scrollHeight'));
      }]));
        return     chan0.on('user:entered',fun([[fun.parameter, fun.wildcard], function(msg)    {
        let [username10] = fun.bind(fun.parameter,sanitize(JS.get_property_or_call_function(msg,'user') || 'anonymous'));
        return     messages0.append('<br/><i>[' + (Kernel.to_string(username10) + ' entered]</i>'));
      }]));
      }]);
    init();
    export {
        init
  };