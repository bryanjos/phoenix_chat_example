defmodule App do
  JS.import [Socket, LongPoller], "js/phoenix/phoenix"
  JS.import JQuery, "jquery"

  defp sanitize(html) do
    JQuery.("<div/>").text(html).html()
  end

  defp messageTemplate(msg) do
    username = sanitize(msg.user || "anonymous")
    body = sanitize(msg.body)

    """
    <p><a href="#">[#{username}]</a>&nbsp; #{body}</p>
    """
  end

  def init() do
    socket = JS.new(Socket, ["/socket", %{
      "logger" => fn(kind, msg, data) ->
        :console.debug("#{kind}: #{msg}", data)
      end
      }])

    socket.connect(%{"user_id" => "123"})

    status = JQuery.("#status")
    messages = JQuery.("#messages")
    input = JQuery.("#message-input")
    username = JQuery.("#username")

    socket.onOpen(fn() ->
      :console.debug("OPEN")
    end)

    socket.onError(fn() ->
      :console.debug("ERROR")
    end)

    socket.onClose(fn() ->
      :console.debug("CLOSE")
    end)

    chan = socket.channel("rooms:lobby", %{})

    chan.join()
    .receive("ignore", fn(msg) -> :console.error("auth error") end)
    .receive("ok", fn(msg) -> :console.info("join ok") end)
    .after(10000, fn() -> :console.info("Connection interruption") end)

    chan.onError(fn(e) ->
      :console.log("Something went wrong", e)
    end)

    chan.onClose(fn(e) ->
      :console.log("channel closed", e)
    end)

    input.off("keypress").on("keypress", fn(e) ->
      if e.keyCode == 13 do
        chan.push("new:msg", %{"user" => username.val(), "body" => input.val()})
        input.val("")
      end
    end)

    chan.on("new:msg", fn(msg, _) ->
      messages.append(messageTemplate(msg))
      scrollTo(0, :document.body.scrollHeight)
    end)

    chan.on("user:entered", fn(msg, _) ->
      username = sanitize(msg.user || "anonymous")
      messages.append("<br/><i>[#{username} entered]</i>")
    end)
  end

  init()
end
