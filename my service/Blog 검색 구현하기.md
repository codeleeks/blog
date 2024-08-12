## 요구 사항

- 제목, 카테고리, 내용을 대상으로 한다.
  - 7글자 이하의 텍스트를 매칭한다.
- 자동완성을 지원한다.
  - 2글자 이상 쓰면 부분적으로나마 매칭하는 텍스트를 찾는다. (edge ngram)
- 하이라이팅을 지원한다.

## 사용 기술

- `elasticsearch 8.14.3`
- `spring data elasticsearch 5.3.2`

## 피저빌리티 체크

- 한영애널라이저 (하나의 필드로 되는지) ➡️ nori가 영어도 다 커버함.(standard 내장한 것으로 추측)
- 하일라이터 ➡️ highlight 기능으로 커버.
- 이미지 경로 지우는 캐릭터 필터 ➡️ 패턴매칭 캐릭터필터 사용. (`\!\[image\]\(https:\/\/[0-9a-z\.\/]+\)`)
- 백틱(\`) 지우는 캐릭터 필터  ➡️ 특수문자로 지워짐.

## 인덱스 셋팅과 매핑

- 제목(title), 카테고리(categories) - edge ngram, nori, 백틱 지우는 캐릭터필터
- 내용(contents): nori, 이미지경로 지우는 캐릭터필터

settings
```json
{
  "index": {
    "analysis": {
      "analyzer": {
        "contents_analyzer": {
          "type": "custom",
          "tokenizer": "nori_custom_tokenizer",
          "char_filter": [
            "markdown_image_path"
          ],
          "filter": [
            "lowercase",
            "nori_synonyms",
            "nori_custom_part_of_speech",
            "stop"
          ]
        },
        "title_analyzer": {
          "type": "custom",
          "tokenizer": "nori_custom_tokenizer",
          "filter": [
            "lowercase",
            "nori_synonyms",
            "nori_custom_part_of_speech",
            "stop",
            "custom_edge_ngram"
          ]
        }
      },
      "char_filter": {
        "markdown_image_path": {
          "type": "pattern_replace",
          "pattern": "\\!\\[image\\]\\(https:\\/\\/[0-9a-z\\-\\.\\/]+\\)",
          "replacement": " "
        }
      },
      "tokenizer": {
        "nori_custom_tokenizer": {
          "type": "nori_tokenizer",
          "user_dictionary": "user_dic/nori_userdic.txt",
          "decompound_mode": "none"
        }
      },
      "filter": {
        "nori_custom_part_of_speech": {
          "type": "nori_part_of_speech"
        },
        "nori_synonyms": {
          "type": "synonym",
          "synonyms_path": "user_dic/nori_synonyms.txt"
        },
        "custom_edge_ngram": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 7
        }
      }
    }
  }
}
```

mappings
```json
{
  "properties": {
    "contents": {
      "type": "text",
      "analyzer": "contents_analyzer"
    },
    "title": {
      "type": "text",
      "analyzer": "title_analyzer"
    },
    "categories": {
      "type": "text",
      "analyzer": "title_analyzer"
    }
  }
}
```

## 스프링 데이터 엘라스틱 서치 샘플 코드

- 인덱스의 `settings`와 `mappings` 설정은 각 설정 파일로 관리(자바 코드로 제공하는 설정으로는 충분치 않음)
- 메서드 네이밍으로 커버하지 못하는 쿼리이므로, 쿼리 빌더를 사용하여 직접 쿼리 생성.
  - 커스텀 레포지토리 활용.
  - `NativeQuery`로 쿼리 생성

컨트롤러
```java
@RestController
@RequiredArgsConstructor
public class UserController {
    private final PostDocumentRepository repository;

    @PostMapping
    public String searchMessage(@RequestBody String keyword) {
        List<PostDocument> byMessage = repository.search(keyword);
        for (PostDocument postDocument : byMessage) {
            System.out.println("userIndex = " + postDocument);
        }
        return "ok";
    }
}
```

레포지토리
```java
public interface PostDocumentRepository extends ElasticsearchRepository<PostDocument, String>, PostDocumentSearchRepository {

}
```

커스텀 레포지토리
```java
//커스텀 레포지토리 인터페이스
public interface PostDocumentSearchRepository {
    List<PostDocument> search(String keyword);
}


//커스텀 레포지토리 구현체
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import lombok.RequiredArgsConstructor;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.HighlightQuery;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;

import java.util.List;

@RequiredArgsConstructor
public class PostDocumentSearchRepositoryImpl implements PostDocumentSearchRepository {
    private final ElasticsearchOperations operations;

    @Override
    public List<PostDocument> search(String keyword) {
        NativeQuery query = NativeQuery.builder()
                .withQuery(qb -> qb.bool(bqb -> bqb.should(
                                QueryBuilders.matchPhrase(mpqb -> mpqb.field("contents").query(keyword)),
                                QueryBuilders.matchPhrase(mpqb -> mpqb.field("title").query(keyword)),
                                QueryBuilders.matchPhrase(mpqb -> mpqb.field("categories").query(keyword))
                        ))
                )
                .withHighlightQuery(
                        new HighlightQuery(new Highlight(
                                List.of(
                                        new HighlightField("contents"),
                                        new HighlightField("title"),
                                        new HighlightField("categories")
                                )
                        ), String.class)
                )
                .build();

        SearchHits<PostDocument> searchHits = operations.search(query, PostDocument.class);

        return searchHits.stream()
                .peek(hit -> System.out.println("hit = " + hit))
                .map(SearchHit::getContent)
                .toList();
    }
}
```
