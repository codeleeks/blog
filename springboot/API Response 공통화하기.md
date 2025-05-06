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
