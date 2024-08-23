## 문제의 시작

`jackson`을 사용해서 테스트 코드를 짜던 중에 **`.*java.util.LinkedHashMap cannot be cast to XXX` **라는 에러가 떴다.

`List<CategoryResponse> posts = objectMapper.readValue(raw, List.class)`가 문제였다.

컴파일러가 캐스팅 문제로 경고를 주었지만 무시하고 실행했더니 이번엔 런타임 에러가 뜬 것이다.

이 문제는 왜 발생할까?

`LinkedHashMap` 이건 뜬금없이 왜 에러 메시지에 나오는 걸까?

## 문제의 원인

`jackson`은 컬렉션의 요소 타입을 지정하지 않으면 디폴트로 `LinkedHashMap`으로 잡는다.

에러 메시지에 `LinkedHashMap`가 나온 이유이다.


## 문제의 해결

`jackson`에서는 컬렉션의 요소 타입을 지정하는 방법으로 **`TypeReference`**라는 클래스를 제공한다. 
동일한 이름의 클래스가 많으니 패키지명에 주의하자.

```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by FernFlower decompiler)
//

package org.testcontainers.shaded.com.fasterxml.jackson.core.type;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;

public abstract class TypeReference<T> implements Comparable<TypeReference<T>> {
    protected final Type _type;

    protected TypeReference() {
        Type superClass = this.getClass().getGenericSuperclass();
        if (superClass instanceof Class) {
            throw new IllegalArgumentException("Internal error: TypeReference constructed without actual type information");
        } else {
            this._type = ((ParameterizedType)superClass).getActualTypeArguments()[0];
        }
    }

    public Type getType() {
        return this._type;
    }

    public int compareTo(TypeReference<T> o) {
        return 0;
    }
}
```

`TypeReference`에서 컬렉션의 요소 타입을 정의하고, 이를 `readValue()`의 파라미터로 넘긴다.
`TypeReference`는 추상 클래스이기 때문에 간편하게 사용하기 위해 익명 클래스를 정의했다. (`{}`)

```java
        TypeReference<List<CategoryResponse>> listTypeReference = new TypeReference<>() {};
        List<CategoryResponse> categories = objectMapper.readValue(mvcResult.getResponse().getContentAsString(),
                listTypeReference);
```

