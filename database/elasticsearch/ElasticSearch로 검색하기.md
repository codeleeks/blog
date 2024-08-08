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

## 토큰 필터

- `lowercase`, `uppercase`: 문자열을 소문자나 대문자로 변환
- `stop`: 불용어를 제거. 영어는 소문자 기준으로 제거하기 때문에 lowercase가 꼭 들어가야 함. cjk

### Synonym(동의어) 필터

동의어를 정의하여 검색에 활용한다.

동의어 정의는 `"a=>b"` 관계거나, `"a,b"`일 수 있다.

`"a=>b"`는 term은 b로 저장되며 a로 검색하면 b를 찾는다. (b를 검색하면 당연히 b를 찾는다)
`"a,b"`는 term은 a, b 둘 다 저장되며 a로 검색하면 b도 같이 찾고, b로 검색하면 a도 같이 찾는다.

동의어 정의는 설정 파일로 구성할 수 있다.
동의어는 파일 내에서 한 줄씩 정의한다.
```txt
quick, fast
hop, jump
```
```bash
//애널라이저 세팅.
PUT my_synonym
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_syn": {
          "tokenizer": "whitespace",
          "filter": [
            "lowercase",
            "syn_aws"
          ]
        }
      },
      "filter": {
        "syn_aws": {
          "type": "synonym",
          "synonyms_path": "user_dic/my_syn_dic.txt"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "message": {
        "type": "text",
        "analyzer": "my_syn"
      }
    }
  }
}

//데이터 삽입
POST my_synonym/_bulk
{"index":{"_index":"my_synonym","_id":"1"}}
{ "message": "Quick brown fox jump" }
{"index":{"_index":"my_synonym","_id":"2"}}
{ "message": "hop rabbit is fast" }

//테스트
POST my_synonym/_analyze
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "message": "quick"
          }
        },
        {
          "term": {
            "message": "jump"
          }
        }
      ]
    }
  }
}
```
```json
{
  "took": 13,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "skipped": 0,
    "failed": 0
  },
  "hits": {
    "total": {
      "value": 2,
      "relation": "eq"
    },
    "max_score": 0.42221838,
    "hits": [
      {
        "_index": "my_synonym",
        "_id": "1",
        "_score": 0.42221838,
        "_source": {
          "message": "Quick brown fox jump"
        }
      },
      {
        "_index": "my_synonym",
        "_id": "2",
        "_score": 0.42221838,
        "_source": {
          "message": "hop rabbit is fast"
        }
      }
    ]
  }
}
```

### NGram 필터

NGram이란 문자열을 N 길이만큼 쪼개는 것이다.
예를 들어, 1Gram(unigram)은 house를 h,o,u,s,e로 쪼개고, 2Gram(bigram)은 ho, ou, us, se로 쪼갠다.

NGram 필터는 min, max를 줄 수 있다. 최소 min만큼의 크기로 쪼개고, 최대 max만큼의 크기로 쪼갠다.
이렇게 쪼개는 모든 경우의 수로 나오는 gram을 Term으로 만든다.
예를 들어, house에 대해 min=1, max=2이면, h,o,u,s,e,ho,ou,us,se가 모든 경우의 수이며 이 모든 gram들은 Term이 된다.

NGram 필터는 Term의 개수를 기하급수적으로 늘리기 때문에 필요한 곳에만 사용한다.

```bash
PUT my_ngram
{
  "settings": {
    "analysis": {
      "filter": {
        "my_ngram_f": {
          "type": "nGram",
          "min_gram": 2,
          "max_gram": 3
        }
      }
    }
  }
}
```

### Edge NGram 필터

문자 시작에서만 NGram을 Term으로 만든다.
house는 min=1, max=4이면 h, ho, hou, hous 까지만 만들고, ou, ous, ouse, us, use 등은 만들지 않는다.

ElasticSearch 7 이후에는 `edge_ngram`으로 변경되었다.

```bash
//애널라이저 세팅팅
PUT my_edge_ngram
{
  "settings": {
    "analysis": {
      "filter": {
        "my_egde_ngram_f": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 4
        }
      }
    }
  }
}

//테스트
POST my_edge_ngram/_analyze
{
  "tokenizer": "standard",
  "filter": [
    "my_egde_ngram_f"
  ],
  "text": "house"
}
```
```json
{
  "tokens": [
    {
      "token": "h",
      "start_offset": 0,
      "end_offset": 5,
      "type": "<ALPHANUM>",
      "position": 0
    },
    {
      "token": "ho",
      "start_offset": 0,
      "end_offset": 5,
      "type": "<ALPHANUM>",
      "position": 0
    },
    {
      "token": "hou",
      "start_offset": 0,
      "end_offset": 5,
      "type": "<ALPHANUM>",
      "position": 0
    },
    {
      "token": "hous",
      "start_offset": 0,
      "end_offset": 5,
      "type": "<ALPHANUM>",
      "position": 0
    }
  ]
}
```

적은 양의 데이터에 대한 자동완성 기능을 구현하는 데 적합하다.

### Shingle 필터

NGram, Edge NGram이 단어를 gram을 쪼갠다면, Shingle은 문장을 gram처럼 쪼갠다.

this is my sweet home이라는 문장은 min=2, max=3이라면 Shingle은 this is, this is my, is my, is my sweet, my sweet, my sweet home으로 쪼갠다.
옵션(`output_unigrams`)에 따라 this, is, my, sweet, home과 같이 1Gram을 Term으로 저장한다.

- `output_unigrams`: 1Gram도 Term으로 저장하는지 지정. 기본값은 true
- `output_unigrams_if_no_shingles`: 쪼갤 수 없는 경우에만 1Gram을 Term으로 저장하는지 지정. 기본값은 false
- `token_separator`: 쪼개는 기준문자를 지정. 기본값은 공백.
- `filler_token`: 불용어를 대체할 문자를 지정. 기본값은 언더스코어(`_`)

```bash
//애널라이저 세팅
PUT my_shingle
{
  "settings": {
    "analysis": {
      "filter": {
        "my_shingle_f": {
          "type": "shingle",
          "min_shingle_size": 3,
          "max_shingle_size": 4,
          "output_unigrams": false,
          "filler_token": "-"
        },
        "my_stop_f": {
          "type": "stop",
          "stopwords": [
            "is"
          ]
        }
      }
    }
  }
}

//테스트
GET my_shingle/_analyze
{
  "tokenizer": "whitespace",
  "filter": [
    "my_stop_f",
    "my_shingle_f"
  ],
  "text": "this is my sweet home"
}
```
```json
{
  "tokens" : [
    {
      "token" : "this - my",
      "start_offset" : 0,
      "end_offset" : 10,
      "type" : "shingle",
      "position" : 0
    },
    {
      "token" : "this - my sweet",
      "start_offset" : 0,
      "end_offset" : 16,
      "type" : "shingle",
      "position" : 0,
      "positionLength" : 2
    },
    {
      "token" : "- my sweet",
      "start_offset" : 8,
      "end_offset" : 16,
      "type" : "shingle",
      "position" : 1
    },
    {
      "token" : "- my sweet home",
      "start_offset" : 8,
      "end_offset" : 21,
      "type" : "shingle",
      "position" : 1,
      "positionLength" : 2
    },
    {
      "token" : "my sweet home",
      "start_offset" : 8,
      "end_offset" : 21,
      "type" : "shingle",
      "position" : 2
    }
  ]
}
```

### unique 필터

unique 필터는 중복되는 토큰을 제거하여 하나만 Term으로 저장한다.

```bash
GET _analyze
{
  "tokenizer": "standard",
  "filter": [
    "lowercase",
    "unique"
  ],
  "text": [
    "white fox, white rabbit, white bear"
  ]
}
```
```json
{
  "tokens" : [
    {
      "token" : "white",
      "start_offset" : 0,
      "end_offset" : 5,
      "type" : "<ALPHANUM>",
      "position" : 0
    },
    {
      "token" : "fox",
      "start_offset" : 6,
      "end_offset" : 9,
      "type" : "<ALPHANUM>",
      "position" : 1
    },
    {
      "token" : "rabbit",
      "start_offset" : 17,
      "end_offset" : 23,
      "type" : "<ALPHANUM>",
      "position" : 2
    },
    {
      "token" : "bear",
      "start_offset" : 31,
      "end_offset" : 35,
      "type" : "<ALPHANUM>",
      "position" : 3
    }
  ]
}
```

## Stemming (형태소 분석)

단어는 다양한 어미를 갖는다. 먹는다. 먹었다. 먹고 있다 등... 
다양한 어미에 대비하기 위해 엘라스틱 서치에서는 단어의 어근을 추출하는 토큰 필터를 제공한다.

단어의 어근을 추출하는 행위는 형태소 분석이라고도 말하며, 영어로는 stemming이라고 한다.
또한, 형태소 분석을 하는 토큰 필터를 stemmer라고 한다.

- snowball: 영어를 stemming한다.
- nori: 한글을 stemming한다.


### nori

Elasticsearch 6.6 버전 부터 공식적으로 Nori(노리) 라고 하는 한글 형태소 분석기를 지원한다.

```bash
bin/elasticsearch-plugin install analysis-nori
```

노리는 토크나이저, 필터로 한글 형태소 분석을 지원한다.

- 토크나이저: `nori_tokenizer`
- 토큰 필터: `nori_part_of_speech`, `nori_readingform`

### `nori_tokenizer`

노리 토크나이저는 한글 어근을 인지하여 토큰으로 만들어 낸다.
예를 들어, 동해물이라는 합성어에서 동해와 물을 각각 토큰으로 만들어낸다.

```bash
POST _analyze
{
  "tokenizer": "nori_tokenizer",
  "text": [
    "동해물과 백두산이"
  ]
}
```
```json
{
  "tokens" : [
    {
      "token" : "동해",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "물",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "과",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "백두",
      "start_offset" : 5,
      "end_offset" : 7,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "산",
      "start_offset" : 7,
      "end_offset" : 8,
      "type" : "word",
      "position" : 4
    },
    {
      "token" : "이",
      "start_offset" : 8,
      "end_offset" : 9,
      "type" : "word",
      "position" : 5
    }
  ]
}
```

노리 토크나이저는 옵션을 통해 합성어 처리 방식을 지정하거나 사용자 사전을 정의할 수 있다.

- `decompound_mode`: 합성어 처리 방식을 지정한다.
  - `none`: 합성어를 분리하지 않는다.
  - `discard`: 합성어를 분리한다. (기본값)
  - `mixed`: 합성어를 분리한 것과 합성어를 분리하지 않은 것을 모두 Term으로 저장한다.
- `user_dictionary`: 설정 파일을 통해 사용자 사전을 정의한다.
  - 사용자 사전에 정의된 단어는 기본 단어보다 높은 우선순위를 갖는다. (예를 들어, 사용자 사전에 "해물"을 적으면, 동해물이라는 합성어에서 동해와 물 대신, 동과 해물로 쪼갠다)

```bash
//애널라이저 세팅
PUT my_nori
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "nori_none": {
          "type": "nori_tokenizer",
          "decompound_mode": "none"
        },
        "nori_discard": {
          "type": "nori_tokenizer",
          "decompound_mode": "discard"
        },
        "nori_mixed": {
          "type": "nori_tokenizer",
          "decompound_mode": "mixed"
        }
      }
    }
  }
}

//테스트
POST my_nori/_analyze
{
  "tokenizer": "nori_none",
  "text": [ "백두산이" ]
}

POST my_nori/_analyze
{
  "tokenizer": "nori_discard",
  "text": [ "백두산이" ]
}

POST my_nori/_analyze
{
  "tokenizer": "nori_mixed",
  "text": [ "백두산이" ]
}
```
```json
{
  "tokens" : [
    {
      "token" : "백두산",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "이",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 1
    }
  ]
}
```
```json
{
  "tokens" : [
    {
      "token" : "백두",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "산",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "이",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 2
    }
  ]
}
```
```json
{
  "tokens" : [
    {
      "token" : "백두산",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "word",
      "position" : 0,
      "positionLength" : 2
    },
    {
      "token" : "백두",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "산",
      "start_offset" : 2,
      "end_offset" : 3,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "이",
      "start_offset" : 3,
      "end_offset" : 4,
      "type" : "word",
      "position" : 2
    }
  ]
}
```

### 토큰 필터 - `nori_part_of_speech`

`stoptags`에 적힌 품사에 해당하는 단어는 Term으로 만들지 않는다.

```bash
//애널라이저 세팅
PUT my_pos
{
  "settings": {
    "index": {
      "analysis": {
        "filter": {
          "my_pos_f": {
            "type": "nori_part_of_speech",
            "stoptags": [
              "NR"
            ]
          }
        }
      }
    }
  }
}

//테스트
POST my_pos/_analyze
{
  "tokenizer": "nori_tokenizer",
  "filter": [
    "my_pos_f"
  ],
  "text": "다섯아이가"
}
```
```json
{
  "tokens" : [
    {
      "token" : "아이",
      "start_offset" : 2,
      "end_offset" : 4,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "가",
      "start_offset" : 4,
      "end_offset" : 5,
      "type" : "word",
      "position" : 2
    }
  ]
}
```

`stoptags`의 기본값은 다음과 같다.

```
"stoptags": [
  "E", "IC", "J", "MAG", "MAJ",
  "MM", "SP", "SSC", "SSO", "SC",
  "SE", "XPN", "XSA", "XSN", "XSV",
  "UNA", "NA", "VSV"
]
```

<MessageBox title='품사 번호 알아내기' level='info'>
  쿼리나 애널라이즈 API에서 `"explain": true` 옵션을 주면 각 토큰의 품사 번호를 포함한 기타 상세 정보를 볼 수 있다.
  ```bash
  POST _analyze
  {
    "tokenizer": "nori_tokenizer",
    "text": "동해물과 백두산이",
    "explain": true
  }
  ```
  ```json
  {
    "detail": {
      "custom_analyzer": true,
      "charfilters": [],
      "tokenizer": {
        "name": "nori_tokenizer",
        "tokens": [
          {
            "token": "동해",
            "start_offset": 0,
            "end_offset": 2,
            "type": "word",
            "position": 0,
            "bytes": "[eb 8f 99 ed 95 b4]",
            "leftPOS": "NNP(Proper Noun)",
            "morphemes": null,
            "posType": "MORPHEME",
            "positionLength": 1,
            "reading": null,
            "rightPOS": "NNP(Proper Noun)",
            "termFrequency": 1
          },
          {
            "token": "물",
            "start_offset": 2,
            "end_offset": 3,
            "type": "word",
            "position": 1,
            "bytes": "[eb ac bc]",
            "leftPOS": "NNG(General Noun)",
            "morphemes": null,
            "posType": "MORPHEME",
            "positionLength": 1,
            "reading": null,
            "rightPOS": "NNG(General Noun)",
            "termFrequency": 1
          },
          {
            "token": "과",
            "start_offset": 3,
            "end_offset": 4,
            "type": "word",
            "position": 2,
            "bytes": "[ea b3 bc]",
            "leftPOS": "J(Ending Particle)",
            "morphemes": null,
            "posType": "MORPHEME",
            "positionLength": 1,
            "reading": null,
            "rightPOS": "J(Ending Particle)",
            "termFrequency": 1
          },
          {
            "token": "백두",
            "start_offset": 5,
            "end_offset": 7,
            "type": "word",
            "position": 3,
            "bytes": "[eb b0 b1 eb 91 90]",
            "leftPOS": "NNG(General Noun)",
            "morphemes": null,
            "posType": "MORPHEME",
            "positionLength": 1,
            "reading": null,
            "rightPOS": "NNG(General Noun)",
            "termFrequency": 1
          },
          {
            "token": "산",
            "start_offset": 7,
            "end_offset": 8,
            "type": "word",
            "position": 4,
            "bytes": "[ec 82 b0]",
            "leftPOS": "NNG(General Noun)",
            "morphemes": null,
            "posType": "MORPHEME",
            "positionLength": 1,
            "reading": null,
            "rightPOS": "NNG(General Noun)",
            "termFrequency": 1
          },
          {
            "token": "이",
            "start_offset": 8,
            "end_offset": 9,
            "type": "word",
            "position": 5,
            "bytes": "[ec 9d b4]",
            "leftPOS": "J(Ending Particle)",
            "morphemes": null,
            "posType": "MORPHEME",
            "positionLength": 1,
            "reading": null,
            "rightPOS": "J(Ending Particle)",
            "termFrequency": 1
          }
        ]
      },
      "tokenfilters": []
    }
  }
  ```
</MessageBox>

### 토큰 필터 - `nori_readingform`

한자를 한글로 변환한다.

```bash
POST _analyze
{
  "tokenizer": "nori_tokenizer",
  "filter": [
    "nori_readingform"
  ],
  "text": "春夏秋冬"
}
```
```json
{
  "tokens": [
    {
      "token": "춘하추동",
      "start_offset": 0,
      "end_offset": 4,
      "type": "word",
      "position": 0
    }
  ]
}
```

## 인덱스 새로고침하기

```bash
POST 인덱스명/_close
POST 인덱스명/_open
```

기존 역 인덱스 구조는 변경되지 않고, 이후에 새로 색인되거나 검색할 때 변경된 애널라이저의 규칙이 반영된다.
기존 역 인덱스 구조를 변경하려면 삭제하고 다시 색인해야 한다.
