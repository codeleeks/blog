## STOMP

Simple Text Oriented Message Protocol의 약자로서, 다섯 개의 명령으로 메시지 프로토콜이 구성된다.

- CONNECT:	클라이언트가 서버에 연결을 요청할 때 사용합니다.
- SEND:	클라이언트 또는 서버가 특정 목적지로 메시지를 보낼 때 사용합니다.
- SUBSCRIBE:	클라이언트가 특정 목적지의 메시지를 구독할 때 사용합니다.
- UNSUBSCRIBE:	클라이언트가 특정 목적지의 메시지 구독을 취소할 때 사용합니다.
- DISCONNECT:	클라이언트가 서버와의 연결을 종료할 때 사용합니다.


## Flow

- FE에서 CONNECT 요청.
```js
const stompClient = new StompJs.Client({
    brokerURL: 'ws://localhost:8080/gs-guide-websocket'
});

$( "#connect" ).click(() => connect());
```

- BE에서 CONNECT 요청 응답
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebsocketConfig implements WebSocketMessageBrokerConfigurer {
    //... 중략

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/gs-guide-websocket");
    }
}

```


- FE에서 성공 응답 수신시 subscribe
```js
stompClient.onConnect = (frame) => {
    setConnected(true);
    console.log('Connected: ' + frame);
    stompClient.subscribe('/topic/greetings', (greeting) => {
        showGreeting(JSON.parse(greeting.body).content);
    });
};
```

- FE에서 메시지 publish
```js
function sendName() {
    stompClient.publish({
        destination: "/app/hello",
        body: JSON.stringify({'name': $("#name").val()})
    });
}
```

- BE에서 SEND처리.
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebsocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

/// ... 중략
}

@Controller
public class GreetingController {
    @MessageMapping("/hello")
    @SendTo("/topic/greetings")
    public Greeting greeting(HelloMessage message) throws Exception {
        Thread.sleep(1000);
        return new Greeting("hello, " + HtmlUtils.htmlEscape(message.getName()) + "!");
    }
}

```

- 개발자 도구 결과
![image](https://github.com/user-attachments/assets/74383f90-c670-4217-a0d5-2b300a0989fa)


## 코드

https://spring.io/guides/gs/messaging-stomp-websocket#scratch
