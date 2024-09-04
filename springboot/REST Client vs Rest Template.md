## Rest Client만의 깔끔한 코드?

인터넷에 돌아다니는 여러 글을 보면 Rest Client로 개발하면 코드가 좀 더 "모던"해진다고 합니다.
체이닝 패턴을 사용해서 그런 것 같은데요.
저도 체이닝 패턴을 엄청 좋아하지만, 사실 Rest Template으로도 유사하게 구현이 가능합니다.

Rest Client의 코드

```java
RestClient restClient = RestClient.create();
Posts body = restClient.get()
        .uri(uri)
        .accept(MediaType.APPLICATION_JSON)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
        .header("X-Github-Api-Version", "2022-11-28")
        .retrieve()
        .body(Posts.class);

log.info("response - {}", body);
```

Rest Template의 코드

```java
RestTemplate restTemplate = new RestTemplate();
RequestEntity<Void> requestEntity = RequestEntity
        .get(uri)
        .accept(MediaType.APPLICATION_JSON)
        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
        .header("X-Github-Api-Version", "2022-11-28")
        .build();

Posts body = restTemplate.exchange(requestEntity, Posts.class)
        .getBody();
log.info("response - {}", body);
```

거의 비슷하지 않나요? `RequestEntity`를 사용하면 빌더로 필요한 설정을 할 수 있게 됩니다.


## Rest Client나 Rest Template이나 그게 그거다.

Rest Client도 복잡한 설정을 하려면 Rest Template처럼 여러 팩토리 클래스와 빌더들을 써야 해요.
내부적으로 Rest Template 인프라를 사용하고 있기 때문입니다.

### 복잡한 설정의 사례1

가장 간단하게는 connection timeout과 read timeout 설정을 할 수 있겠죠. (이 설정은 실무에서 거의 필수라고 봅니다.)

```java
ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.DEFAULTS
        .withConnectTimeout(Duration.ofSeconds(10L))
        .withReadTimeout(Duration.ofSeconds(20L));

ClientHttpRequestFactory clientHttpRequestFactory = ClientHttpRequestFactories.get(settings);

RestClient restClient = RestClient.builder()
        .requestFactory(clientHttpRequestFactory)
        .build();
```

### 복잡한 설정의 사례2

connection pool을 사용해야 할 때는 어떻게 할까요?
앞선 사례보다 더 복잡해집니다.

```java
HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory = new HttpComponentsClientHttpRequestFactory();
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

### 복잡한 설정의 사례3

connection timeout과 read timeout도 필요하고, connection pool(connection pool에서 connection을 요청할 때 설정할 타임아웃도 필요하죠)도 필요하며, ssl 설정도 필요하다면요?

```java
HttpComponentsClientHttpRequestFactory httpComponentsClientHttpRequestFactory = new HttpComponentsClientHttpRequestFactory();
httpComponentsClientHttpRequestFactory.setConnectTimeout(connTimeout);
//connection pool이 꽉 찼을 때 타임아웃만큼 기다림.
httpComponentsClientHttpRequestFactory.setConnectionRequestTimeout(connReqTimeout);

SocketConfig socketConfig = SocketConfig.custom()
        .setSoTimeout(readTimeout, TimeUnit.MILLISECONDS)
        .build();

//ssl 설정
SslOptions options = sslBundle.getOptions();
SSLConnectionSocketFactory socketFactory = new SSLConnectionSocketFactory(sslBundle.createSslContext(),
        options.getEnabledProtocols(), options.getCiphers(), new DefaultHostnameVerifier());

PoolingHttpClientConnectionManager poolingHttpClientConnectionManager = PoolingHttpClientConnectionManagerBuilder.create()
        .setMaxConnTotal(100)
        .setMaxConnPerRoute(10)
        .setDefaultSocketConfig(socketConfig)
        .setSSLSocketFactory(socketFactory)
        .useSystemProperties()
        .build();

CloseableHttpClient client = HttpClientBuilder.create()
        .setConnectionManager(poolingHttpClientConnectionManager)
        .build();

httpComponentsClientHttpRequestFactory.setHttpClient(client);

RestClient restClient = RestClient.builder()
        .requestFactory(httpComponentsClientHttpRequestFactory)
        .build();
```

되게 복잡하네요. 여러 개의 팩토리를 거쳐서 RestClient를 만들어냈습니다.
웹 요청 한 번 하기 참 어렵네요.

## 결론

결국 RestClient나 RestTemplate나 복잡한 설정이 들어가면 복잡해지는 건 마찬가지입니다.
