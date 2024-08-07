본 포스팅에서 사용하는 도표 및 그림은 https://esbook.kimjmin.net/ 에서 가져왔음을 밝힙니다.

## 역 인덱스 (inverted index)

Term으로 Document를 찾는 구조.

Term은 쉽게 말해 검색의 키워드이며, Document는 검색 결과로 보여줄 데이터이다.
Term은 Document의 내용에서 키워드를 뽑아 만들어진다.

역인덱스는 키워드를 Document가 실제 저장된 위치를 가리키는 id와 매핑한다.

![image](https://github.com/user-attachments/assets/9f2edfa8-da59-4004-9877-1099c6f10397)

역인덱스는 키워드에 도큐먼트가 리스트로 매핑이 되는 구조라서, 데이터가 늘어도 키워드가 늘지 않으면 검색 성능에 큰 영향을 주지 않는다.

역인덱스는 도큐먼트가 삽입될 때 만들어진다. 
그래서 ElasticSearch에서 데이터 삽입을 색인이라고 한다.

## Analyzer (애널라이저)

삽입하는 도큐먼트에 문자열(text) 필드가 있을 때, 이 필드에 대해 역인덱스가 생성된다.(여기서 필드는 RDB에서 컬럼과 같다.)
text 타입 필드별로 역인덱스가 생성된다.

역인덱스의 Term는 애널라이저의 문맥에서는 토큰(token)이라 한다.
애널라이저는 문자열 필드의 값을 규칙에 맞게 잘게 쪼개어 토큰으로 만든다.
토큰은 역인덱스의 Term이 된다.

더 정확히 말하면, 애널라이저는 세 가지 단계를 거쳐 Term을 생성한다.

- character filter(캐릭터 필터): 전처리 필터 (0~3개)
- tokenizer(토크나이저): 문자열 필드값을 여러 개의 토큰으로 쪼갬 (1개)
- token filter(토큰 필터): 토큰을 다른 값으로 변환 (0~n개)

![image](https://github.com/user-attachments/assets/a209806a-1dc7-474d-8a05-a6ca4099da25)

캐릭터 필터는 예를 들어 html 문서에서 tag를 없애는 작업이 될 수 있다.

토크나이저는 standard, whitespace, ngram 등 토크나이저에 따라 토큰을 만드는 규칙이 다르다. [토크나이저 공식 레퍼런스](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-tokenizers.html)

토큰 필터는 lowercase, stopword, snowball, synonym  등 만들어진 토큰을 변환하거나 삭제할 수 있다.

![image](https://github.com/user-attachments/assets/88355994-f1c7-499c-92b1-51d9661f586a)

![image](https://github.com/user-attachments/assets/33d29bc5-2fb9-4176-8bf3-d0aa32103ac9)

![image](https://github.com/user-attachments/assets/1ee291f2-4d20-4ee3-bf8b-2f6db5211bcb)

![image](https://github.com/user-attachments/assets/8806fcd2-5d9d-4723-a889-79753e889401)

### `_analyze` API

`_analyze` API를 사용하면 문자열 필드를 토큰화한 결과를 테스트해볼 수 있다.

```bash
POST _analyze
{
  "text": "The quick brown fox jumps over the lazy dog",
  "tokenizer": "whitespace",
  "filter": [
    "lowercase",
    "stop",
    "snowball"
  ]
}
```
```json
{
  "tokens": [
    {
      "token": "quick",
      "start_offset": 4,
      "end_offset": 9,
      "type": "word",
      "position": 1
    },
    {
      "token": "brown",
      "start_offset": 10,
      "end_offset": 15,
      "type": "word",
      "position": 2
    },
    {
      "token": "fox",
      "start_offset": 16,
      "end_offset": 19,
      "type": "word",
      "position": 3
    },
    {
      "token": "jump",
      "start_offset": 20,
      "end_offset": 25,
      "type": "word",
      "position": 4
    },
    {
      "token": "over",
      "start_offset": 26,
      "end_offset": 30,
      "type": "word",
      "position": 5
    },
    {
      "token": "lazi",
      "start_offset": 35,
      "end_offset": 39,
      "type": "word",
      "position": 7
    },
    {
      "token": "dog",
      "start_offset": 40,
      "end_offset": 43,
      "type": "word",
      "position": 8
    }
  ]
}
```

`whitespace` 토크나이저는 공백으로 쪼개어 토큰을 생성한다.

`lowercase` 토큰 필터는 토큰의 대문자를 소문자로 만들고, `stop`은 불용어(the, a, of 등 문장 구성에 필요한 단어들)를 삭제하며, `snowball`은 영어의 형태소 분석으로 검색에 유리한 문자열로 변경한다.

더 간단하게는, analyzer를 지정하여 캐릭터필터, 토크나이너, 토큰필터 조합을 사용할 수 있다.

```bash
POST _analyze
{
  "text": "The quick brown fox jumps over the lazy dog",
  "analyzer": "snowball"
}
```

여기서 지정하는 애널라이저는 커스텀으로 만든 애널라이저를 사용할 수도 있다.

### Term 쿼리

Term 쿼리는 애널라이저를 적용하지 않고 검색어 그대로 역인덱스에서 일치하는 텀을 찾는다.

```bash
POST my_index2/_search
{
  "query": {
    "term": {
      "message": "jumps"
    }
  }
}
```

애널라이저는 Term 만들 때 원문에서 추출한 토큰을 수정하기도 한다.(예를 들어, snowball은 jumps를 좀 더 일반적인 단어인 jump로 변경하여 검색 가능성을 높인다.)
이 때 term 쿼리는 검색어 그대로 역인덱스에서 찾기 때문에, jumps라고 검색어를 입력하면 검색이 되지 않을 수 있다.

### 인덱스 필드에 애널라이저 적용하기

인덱스에 여러 개의 애널라이저를 등록하고, 각 필드에 애널라이저를 적용할 수 있다.
또한, 각 필드에서는 색인시 적용할 애널라이저("analyzer")와 검색시 적용할 애널라이저("search_analyzer")를 따로 지정할 수 있다.

```bash
PUT movie_analyzer
{
  "settings": {
    "analysis": {
      "analyzer": {
        "movie_lower_test_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase"
          ]
        },
        "movie_stop_test_alalyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "english_stop"
          ]
        }
      },
      "filter": {
        "english_stop": {
          "type": "stop",
          "stopwords": "_english_"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "movie_stop_test_alalyzer",
        "search_analyzer": "movie_lower_test_analyzer"
      }
    }
  }
}
```

### 도큐먼트의 역인덱스 확인

`_termvectors` API를 사용한다.
document id를 넣어줘야 하고, 여러 개의 필드를 한 번에 확인하려면 `fields=field1,field2`와 같이 지정한다.

```bash
GET movie_analyzer/_termvectors/1?fields=title
```
```json
{
  "_index": "movie_analyzer",
  "_id": "1",
  "_version": 1,
  "found": true,
  "took": 1,
  "term_vectors": {
    "title": {
      "field_statistics": {
        "sum_doc_freq": 4,
        "doc_count": 1,
        "sum_ttf": 4
      },
      "terms": {
        "chamber": {
          "term_freq": 1,
          "tokens": [
            {
              "position": 4,
              "start_offset": 21,
              "end_offset": 28
            }
          ]
        },
        "harry": {
          "term_freq": 1,
          "tokens": [
            {
              "position": 0,
              "start_offset": 0,
              "end_offset": 5
            }
          ]
        },
        "potter": {
          "term_freq": 1,
          "tokens": [
            {
              "position": 1,
              "start_offset": 6,
              "end_offset": 12
            }
          ]
        },
        "secrets": {
          "term_freq": 1,
          "tokens": [
            {
              "position": 6,
              "start_offset": 32,
              "end_offset": 39
            }
          ]
        }
      }
    }
  }
}
```

## 캐릭터 필터

토큰으로 만들기 전 전처리하는 단계이다.

### `html_strip` 필터

html 태그를 없애고, html 엔티티도 해석하여 일반 문자열로 변환한다.

### `mapping` 필터

특정 단어를 다른 단어로 변환한다. 

기본 애널라이저인 standard 애널라이저는 특수문자를 제거한다.

그래서 `C`나 `C++`은 동일한 Term으로 취급된다.

그런데 `C`와 `C++`을 다르게 취급해야 하는 것처럼 특수문자가 검색에 중요한 경우가 있을 수 있다.

이 때는 `mapping` 필터를 써서 특수문자를 다른 문자로 변환하여 Term으로 저장하는 방법이 있다.


```bash
PUT coding
{
  "settings": {
    "analysis": {
      "analyzer": {
        "coding_analyzer": {
          "char_filter": [
            "cpp_char_filter"
          ],
          "tokenizer": "whitespace",
          "filter": [ "lowercase", "stop", "snowball" ]
        }
      },
      "char_filter": {
        "cpp_char_filter": {
          "type": "mapping",
          "mappings": [ "+ => _plus_", "- => _minus_" ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "language": {
        "type": "text",
        "analyzer": "coding_analyzer"
      }
    }
  }
}
```

### `pattern_replace` 필터

정규표현식으로 문자열을 찾고, 변환한다.

```bash
PUT camel
{
  "settings": {
    "analysis": {
      "analyzer": {
        "camel_analyzer": {
          "char_filter": [
            "camel_filter"
          ],
          "tokenizer": "standard",
          "filter": [
            "lowercase"
          ]
        }
      },
      "char_filter": {
        "camel_filter": {
          "type": "pattern_replace",
          "pattern": "(?<=\\p{Lower})(?=\\p{Upper})",
          "replacement": " "
        }
      }
    }
  }
}
```
