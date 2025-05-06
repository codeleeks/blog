## Envelope pattern

클라이언트에게 비교적 통일된 API response 형태를 제공하기 위한 방법.

통일된 응답 구조로 데이터를 감싸서 보낸다.

```json
{
 "success": true,
 "data": { /* 응답 데이터 */ },
 "message": "요청이 성공적으로 처리되었습니다."
}
```

<MessageBox title='응답 구조 예제' level='info'>
  
 
 wanted challenge에서 괜찮아 보이는 응답 구조 예제가 있어서 적어본다.

  - 성공 응답
    ```json
    {
     "success": true,
     "data": { /* 응답 데이터 */ },
     "message": "요청이 성공적으로 처리되었습니다."
    }
    ```
  - 페이지네이션 포함 성공 응답
    ```json
      {
       "success": true,
       "data": {
         "items": [ /* 응답 데이터 배열 */ ],
         "pagination": {
           "total_items": 100,
           "total_pages": 10,
           "current_page": 1,
           "per_page": 10
         }
       },
       "message": "요청이 성공적으로 처리되었습니다."
      }
    ```
  - 에러 응답
    ```json
      {
       "success": false,
       "error": {
         "code": "ERROR_CODE",
         "message": "에러 메시지",
         "details": { /* 추가적인 에러 정보 (선택적) */ }
       }
      }
    ```
</MessageBox>


## 방법1. 모든 컨트롤러 메서드에서 공통 객체를 리턴한다.

처음 떠오르는 생각은 응답 클래스를 하나 잘 정의해서 모든 컨트롤러에서 이를 리턴하는 방법이다.

```java
@GetMapping("/api/performances/{performanceId}")
public ApiResponse<PerformanceResponse> findPerformanceById(
		@PathVariable Long performanceId,
		HttpServletRequest httpServletRequest
) {
    PerformanceResponse data = performanceService.findPerformanceById(performanceId);

		return ApiResponse.builder()
				.path(httpServletRequest.getRequestURI())
				.data(data)
				.build();
}

@GetMapping("/api/performances")
public ApiResponse<List<PerformanceResponse>> findAllPerformances(HttpServletRequest httpServletRequest) {
		List<PerformanceResponse> data = performanceService.findAllPerformances();

		return ApiResponse.builder()
				.path(httpServletRequest.getRequestURI())
				.data(data)
				.build();
}
```

## 방법2. `ResponseBodyAdvice`를 사용한다.

스프링은 `ResponseBodyAdvice` 클래스를 제공하여....

질문1) ResponseBodyAdvice은 어느 단에서 처리되는가? handlerAdaptor? 

컨트롤러는 본인의 DTO 객체를 리턴하고, ResponseBodyAdvice 구현체는 DTO 객체를 받아 공통 응답 객체로 감싸준다.

```java
@Component
@RequiredArgsConstructor
@RestControllerAdvice
public class ApiControllerAdvice implements ResponseBodyAdvice<Object> {
  private final I18nService i18nService;

  //컨트롤러에서 String 반환시 StringMessageConverter가 선택되고, APIResponse로 래핑했을 때 타입 에러가 나서 정상적인 응답을 하지 못한다.
  //supports 메서드는 어떤 응답 타입, 어떤 메시지컨버터가 선택될 때 이 어드바이스를 수행할지 선택한다.
  @Override
  public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
    return AbstractJackson2HttpMessageConverter.class.isAssignableFrom(converterType);
  }

  @Override
  public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                ServerHttpRequest request, ServerHttpResponse response) {
    if (body instanceof ApiResponse || body instanceof ApiPageResponse) {
      return body;
    }

    ApiMessage annotation = returnType.getMethodAnnotation(ApiMessage.class);
    String messageKey = annotation != null ? annotation.value() : "default.success";
    String message = i18nService.getMessage(messageKey);

    if (body instanceof Page<?> page) {
      return ApiPageResponse.of(page, message);
    }

    return ApiResponse.of(body, message);
  }
}

```
