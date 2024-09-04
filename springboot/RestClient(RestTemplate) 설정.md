## 웹 요청과 사용자수

웹 요청이 필요한 서비스라고 하자.

가령 API 하나가 10초 정도 걸린다고 할 때, 서비스는 요청에 대한 응답을 받을 때까지 커넥션과 스레드를 사용한다.
그런데 사용자가 많아져서 API를 동시에 10000개를 요청한다면 어떨까?
커넥션과 스레드는 10000개가 생기려다가 오류가 날 것이다. 서비스 장애이다.

그럼 어떻게 해야 할까?

웹 요청에 스레드풀을 전용으로 할당하자.

## 웹 요청에 스레드풀 설정

- `HttpClientConnectionManager`를 구현한 `PoolingHttpClientConnectionManager`를 사용한다.
- maxConnTotal: 커넥션 쓰레드 최대 갯수
- maxConnPerRoute: IP+PORT 당 커넥션 스레드 수

```java
PoolingHttpClientConnectionManager poolingHttpClientConnectionManager = PoolingHttpClientConnectionManagerBuilder.create()
        .setMaxConnTotal(100)
        .setMaxConnPerRoute(10)
        .build();

CloseableHttpClient client = HttpClientBuilder.create()
        .setConnectionManager(poolingHttpClientConnectionManager)
        .build();

httpComponentsClientHttpRequestFactory.setHttpClient(client);

RestClient restClient = RestClient.builder()
        .requestFactory(httpComponentsClientHttpRequestFactory)
        .build();
```

그런데 웹 요청을 처리하는 타겟 서비스가 항상 10초 내의 응답을 보장하지 않을 수 있다.
그 또한 요청이 몰리면 얼마든지 느려질 수 있다.

우리 서비스가 감내할 수 있는 시간을 정하고, 이를 웹 요청의 타임아웃으로 설정해야 한다.

## 웹 요청에 타임아웃 설정

- connecttTimeout: 접속 완료까지 기다리는 최대 시간
- connectionRequestTimeout: 커넥션풀이 모두 사용 중일 때 가용 스레드가 기다리는 최대 시간
- soTimeout: 데이터 응답까지 기다리는 최대 시간

```java
HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory = new HttpComponentsClientHttpRequestFactory();
httpComponentsClientHttpRequestFactory.setConnectTimeout(connTimeout);
//connection pool이 꽉 찼을 때 타임아웃만큼 기다림.
httpComponentsClientHttpRequestFactory.setConnectionRequestTimeout(connReqTimeout);

SocketConfig socketConfig = SocketConfig.custom()
        .setSoTimeout(readTimeout, TimeUnit.MILLISECONDS)
        .build();

PoolingHttpClientConnectionManager poolingHttpClientConnectionManager = PoolingHttpClientConnectionManagerBuilder.create()
        .setMaxConnTotal(100)
        .setMaxConnPerRoute(10)
        .setDefaultSocketConfig(socketConfig)
        .build();

CloseableHttpClient client = HttpClientBuilder.create()
        .setConnectionManager(poolingHttpClientConnectionManager)
        .build();

httpComponentsClientHttpRequestFactory.setHttpClient(client);


RestClient restClient = RestClient.builder()
        .requestFactory(httpComponentsClientHttpRequestFactory)
        .build();
```

타임아웃의 종류는 여러 가지이다.

스레드풀에서 스레드를 가져올 때의 타임아웃, 웹 요청 소켓을 맺을 때의 타임아웃, 웹 요청에 대한 응답의 타임아웃 등이 있다.
이러한 타임아웃들을 모두 정하고, 설정해줘야 한다.

추가적으로 웹 연결시 keep-alive 기능을 제거하거나, 타임아웃을 둬야 한다.
keep-alive는 커넥션을 재활용하는 측면에서 성능상 유리할 수 있으나, half-connection problem이 생길 수 있다.

## keep-alive 처리하기

- evictIdelConnections: 지정한 시간 동안 데이터 읽기/쓰기가 발생하지 않는 커넥션은 끊어버린다. (커넥션풀에서 쫓아낸다(evict))
- evictExpiredConnections: 만료된 커넥션은 끊어버린다.
- timeToLive: 커넥션이 맺어진 후 이용할 수 있는 최대 시간. 이 시간이 지나면 커넥션 만료된다.

```java
HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory = new HttpComponentsClientHttpRequestFactory();
httpComponentsClientHttpRequestFactory.setConnectTimeout(connTimeout);
//connection pool이 꽉 찼을 때 타임아웃만큼 기다림.
httpComponentsClientHttpRequestFactory.setConnectionRequestTimeout(connReqTimeout);

SocketConfig socketConfig = SocketConfig.custom()
        .setSoTimeout(readTimeout, TimeUnit.MILLISECONDS)
        .build();


PoolingHttpClientConnectionManager poolingHttpClientConnectionManager = PoolingHttpClientConnectionManagerBuilder.create()
        .setMaxConnTotal(100)
        .setMaxConnPerRoute(10)
        .setDefaultSocketConfig(socketConfig)
        .setDefaultConnectionConfig(ConnectionConfig.custom()
                .setTimeToLive(TimeValue.ofMilliseconds(connTimeToLive))
                .build())
        .build();

CloseableHttpClient client = HttpClientBuilder.create()
        .setConnectionManager(poolingHttpClientConnectionManager)
        .evictIdleConnections(TimeValue.ofMilliseconds(maxIdleConnTimeout))
        .evictExpiredConnections()
        .build();

httpComponentsClientHttpRequestFactory.setHttpClient(client);


RestClient restClient = RestClient.builder()
        .requestFactory(httpComponentsClientHttpRequestFactory)
        .build();


Posts body = restClient.get()
        .uri(uri)
        .accept(MediaType.APPLICATION_JSON)
//keep-alive 끄기
        .header(HttpHeaders.CONNECTION, "close")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
        .header("X-Github-Api-Version", "2022-11-28")
        .retrieve()
        .body(Posts.class);
```

## 전체 코드

```java
int connReqTimeout = 10000;
int connTimeout = 10000;
int readTimeout = 2000;
int maxIdleConnTimeout = 10000;
int connTimeToLive = 30000;

String uri = String.format("https://api.github.com/repos/%s/%s/git/trees/%s?recursive=true", owner, repo, branch);

HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory = new HttpComponentsClientHttpRequestFactory();
httpComponentsClientHttpRequestFactory.setConnectTimeout(connTimeout);
//connection pool이 꽉 찼을 때 타임아웃만큼 기다림.
httpComponentsClientHttpRequestFactory.setConnectionRequestTimeout(connReqTimeout);

SocketConfig socketConfig = SocketConfig.custom()
        .setSoTimeout(readTimeout, TimeUnit.MILLISECONDS)
        .build();

//ssl 설정
//        SslOptions options = sslBundle.getOptions();
//        SSLConnectionSocketFactory socketFactory = new SSLConnectionSocketFactory(sslBundle.createSslContext(),
//                options.getEnabledProtocols(), options.getCiphers(), new DefaultHostnameVerifier());

PoolingHttpClientConnectionManager poolingHttpClientConnectionManager = PoolingHttpClientConnectionManagerBuilder.create()
        .setMaxConnTotal(100)
        .setMaxConnPerRoute(10)
        .setDefaultSocketConfig(socketConfig)
        .setDefaultConnectionConfig(ConnectionConfig.custom()
                .setTimeToLive(TimeValue.ofMilliseconds(connTimeToLive))
                .build())
//                .setSSLSocketFactory(socketFactory)
//                .useSystemProperties()
        .build();

CloseableHttpClient client = HttpClientBuilder.create()
        .setConnectionManager(poolingHttpClientConnectionManager)
        .evictIdleConnections(TimeValue.ofMilliseconds(maxIdleConnTimeout))
        .evictExpiredConnections()
        .build();

httpComponentsClientHttpRequestFactory.setHttpClient(client);


RestClient restClient = RestClient.builder()
        .requestFactory(httpComponentsClientHttpRequestFactory)
        .build();


Posts body = restClient.get()
        .uri(uri)
        .accept(MediaType.APPLICATION_JSON)
//                .header(HttpHeaders.CONNECTION, "close")
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
        .header("X-Github-Api-Version", "2022-11-28")
        .retrieve()
        .body(Posts.class);
```

## 참고

[참고](https://incheol-jung.gitbook.io/docs/q-and-a/spring/resttemplate)
