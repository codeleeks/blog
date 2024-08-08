본 포스팅에서 사용하는 도표 및 그림은 https://esbook.kimjmin.net/ 에서 가져왔음을 밝힙니다.

## 샤드와 레플리카

인덱스는 샤드로 쪼개져서 저장된다.

![image](https://github.com/user-attachments/assets/3f70734a-5a90-4412-90c7-71ad05f6b2ac)

샤드는 레플리카(복제본)를 가지며, 프라이머리 샤드(원본)과 레플리카는 최대한 서로 다른 노드에 배치되려고 한다.

![image](https://github.com/user-attachments/assets/f152cc70-816a-42cd-b3b9-2ba6a2726b7e)


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

## settings

모든 인덱스는 settings와 mappings를 갖는다.

settings에는 샤드 갯수, 레플리카 갯수, 애널라이저 등 설정 정보가 들어간다.

```json
{
  "settings": {
    "number_of_shards":  3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "my_analyzer": {
          "type": "custom",
          "char_flter": [ "...", "..." ... ]
          "tokenizer": "...",
          "filter": [ "...", "..." ... ]
        }
      },
      "char_filter":{
        "my_char_filter":{
          "type": "…"
        }
      }
      "tokenizer": {
        "my_tokenizer":{
          "type": "…"
        }
      },
      "filter": {
        "my_token_filter": {
          "type": "…"
        }
      }
    }
  }
}
```

샤드는 인덱스 생성 이후에 변경하기 어렵고, 레플리카는 변경 가능하다.
애널라이저는 인덱스 생성 이후에 변경하기 어렵다.

## mappings

RDB에서 DDL로 테이블의 컬럼 타입을 정의하듯이, 엘라스틱서치에서는 mappings를 통해 필드의 타입을 정의한다.

필드의 타입은 미리 정의할 수도 있고, 첫 도큐먼트에 들어 있는 각 필드의 값에 따라 타입 추론할 수도 있다.(동적 타입)

필드 타입 사전 정의하기.
```bash
PUT <인덱스명>
{
  "mappings": {
    "properties": {
      "<필드명>":{
        "type": "<필드 타입>"
        … <필드 설정>
      }
      …
    }
  }
}
```

### `text`

텍스트 타입 필드는 애널라이저를 통해 Term으로 쪼개지는 대상이다.

- `"analyzer" : "<애널라이저명>"`: 색인에 사용할 애널라이저 지정. 기본값은 `standard`
- `"search_analyzer" : "<애널라이저명>"`: 검색에 사용할 애널라이저 지정. 기본값은 `analyzer`에 지정한 애널라이저. 보통 NGram 방식으로 색인했다 검색은 다른 애널라이저를 쓴다.
- `"index" : <true | false>`: false이면 필드를 역 인덱스로 만들지 않는다. 검색에서 제외시킨다. (기본값은 true)
- `"boost" : <숫자 값>`: 값이 1보다 크면 검색시 가산점을 받고, 1보다 작으면 감점을 받는다. 기본값은 1이다.


### `keyword`

키워드 타입 필드는 쪼개지지 않고 그대로 Term이 된다.

보통 집계나 정렬에 활용되는 필드를 keyword로 설정한다.

- `index`, `boost` 설정은 `text`와 동일
- `"doc_values" : <true | false>`: false로 하면 열 기반 저장소(columnar store)를 만들지 않아 집계나 정렬이 불가능해진다. 기본값은 true.
- `"ignore_above" : <자연수>`: 이 값보다 크면 색인이 되지 않아서 검색이나 집계가 되지 않는다. 디폴트는 `2,147,483,647`
- `"normalizer" : "<노멀라이저명>"`: keyword는 애널라이저를 적용할 수 없고, 노멀라이저를 적용한다. 노멀라이저는 settings에서 설정하며, 캐릭터 필터와 토큰 필터로 구성된다.

## 숫자 타입

엘라스틱서치는 자바에서 지원하는 숫자 타입과 엘라스틱서치만의 숫자 타입으로 숫자 타입을 지원한다.

- long, integer, short, byte, float, double: 자바의 숫자 타입과 동일
- `half_float`: 16비트 실수
- `scaled_float`: long 타입이지만 소수점을 저장. 소수점 자리가 고정인 데이터에 사.

옵션은 아래와 같다.

- `index`, `doc_values`, `boost`는 text, keyword와 동일
- `"coerce": <true | false>`: 필드의 타입에 맞지 않는 값을 넣을 때 필드의 타입으로 맞출 건지 지정. 예를 들어 integer 필드에 `4.5`를 넣으면 4가 입력됨. 기본값은 true
- `"null_value" : <숫자값>`: 도큐먼트에 필드가 없거나 값이 null인 경우에 넣을 숫자를 지정.
- `"ignore_malformed" : <true | false>`: false면 오류가 있는 값을 입력했을 때 에러를 반환. true로 지정하더라도 색인에 포함되지 않아서 집계나 검색이 불가능하다.
- `"scaling_factor" : <10의 배수>`: `scaled_float` 타입 필드에만 설정 가능한 옵션. 소수점 자리수를 결정한다. 10이면 첫째자리, 100이면 둘째자리까지 표시한다는 의미.

## 날짜

ISO8601 형식을 따른다.

`format` 옵션을 통해 다양한 날짜 형식을 지원하게 설정할 수 있다.

- `"doc_values"`, `"index"`, `"null_value"`, `"ignore_malformed"`는 다른 타입과 동일.
- `"format" : "<문자열 || 문자열 ...>"`: 입력 가능한 날짜 형식을 `||`로 구분하여 여러 개 적는다. 여기서 작성한 날짜 형식으로 검색 가능하다.
  - [사용가능한 날짜 형식](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-date-format.html#built-in-date-formats)
  - ElasticSearch 8 버전에서 테스트 결과 `_search` API시 다른 날짜 형식을 섞어 쓰면 에러가 발생한다. 통일된 날짜 형식을 써야 한다.


```bash
//다양한 날짜 형식 세팅
PUT my_date
{
  "mappings": {
    "properties": {
      "date_val": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||yyyy/MM/dd||epoch_millis"
      }
    }
  }
}

//도큐먼트 색인 (날짜 형식이 검색과 다름)
PUT my_date/_doc/1
{
  "date_val": "2019-09-12 15:01:23"
}

//범위 검색
POST my_date/_search
{
  "query": {
    "range": {
      "date_val": {
        "gt": "2019/09/10",
        "lt": "2019/09/14"
      }
    }
  }
}

//혹은 epoch_millis로 검색
POST my_date/_search
{
  "query": {
    "range": {
      "date_val": {
        "gt": 1468332800000,
        "lt": 1568332800000
      }
    }
  }
}
```
```json
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits" : [
      {
        "_index" : "my_date",
        "_type" : "_doc",
        "_id" : "1",
        "_score" : 1.0,
        "_source" : {
          "date_val" : "2019-09-12 15:01:23"
        }
      }
    ]
  }
}
```

### boolean

`"type": "boolean"`로 선언한다.

### Object

필드 안에 하위 필드를 갖는 객체형태의 타입이다.

검색할 때는 `.` 연산자로 하위 필드를 지정한다.

```bash
//필드 타입 세팅
PUT movie
{
  "mappings": {
    "properties": {
      "characters": {
        "properties": {
          "name": {
            "type": "text"
          },
          "age": {
            "type": "byte"
          },
          "side": {
            "type": "keyword"
          }
        }
      }
    }
  }
}

//오브젝트 필드 검색
POST movie/_search
{
  "query": {
    "match": {
      "characters.name": "Iron Man"
    }
  }
}
```

도큐먼트의 오브젝트 필드에 여러 개의 값이 들어 있는 경우에 이 값들에서 추출된 Term은 역인덱스에서 하나의 도큐먼트를 가리키게 된다.

그래서 의도치 않은 검색 결과가 나올 수 있다.

```bash
PUT movie/_doc/2
{
  "title": "The Avengers",
  "characters": [
    {
      "name": "Iron Man",
      "side": "superhero"
    },
    {
      "name": "Loki",
      "side": "villain"
    }
  ]
}

PUT movie/_doc/3
{
  "title": "Avengers: Infinity War",
  "characters": [
    {
      "name": "Loki",
      "side": "superhero"
    },
    {
      "name": "Thanos",
      "side": "villain"
    }
  ]
}

POST movie/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "characters.name": "Loki"
          }
        },
        {
          "match": {
            "characters.side": "villain"
          }
        }
      ]
    }
  }
}
```
```json
{
  "took" : 2,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 2,
      "relation" : "eq"
    },
    "max_score" : 1.0611372,
    "hits" : [
      {
        "_index" : "movie",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 1.0611372,
        "_source" : {
          "title" : "Avengers: Infinity War",
          "characters" : [
            {
              "name" : "Loki",
              "side" : "superhero"
            },
            {
              "name" : "Thanos",
              "side" : "villain"
            }
          ]
        }
      },
      {
        "_index" : "movie",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.9827781,
        "_source" : {
          "title" : "The Avengers",
          "characters" : [
            {
              "name" : "Iron Man",
              "side" : "superhero"
            },
            {
              "name" : "Loki",
              "side" : "villain"
            }
          ]
        }
      }
    ]
  }
}
```

3번 도큐먼트에는 슈퍼히어로인 로키와 빌런인 타노스가 있다.
2번 도큐먼트와 3번 도큐먼트 모두 side가 빌런인 값이 있고(2번은 로키, 3번은 타노스), 또한 name이 로키인 값도 있기 때문에 2,3번 도큐먼트가 모두 검색된다.

![image](https://github.com/user-attachments/assets/8db88eb3-177b-455e-82cd-6cdadadf38b9)

문제는 오프젝트 필드가 하위 필드의 여러 값들을 하나의 도큐먼트로 퉁 쳐버리기 때문에 발생한다.

### Nested

Object의 문제를 해결하는 타입이 바로 Nested이다.

Nested 필드는 하위 필드를 가상의 다른 도큐먼트로 관리한다.
하위 필드에 값이 여러 개 입력되어도 각 값이 다른 도큐먼트로 처리된다.

```bash
//Nested 필드 세팅
PUT movie
{
  "mappings": {
    "properties": {
      "characters": {
        "type": "nested",
        "properties": {
          "name": {
            "type": "text"
          },
          "side": {
            "type": "keyword"
          }
        }
      }
    }
  }
}

//도큐먼트 색인
PUT movie/_doc/2
{
  "title": "The Avengers",
  "characters": [
    {
      "name": "Iron Man",
      "side": "superhero"
    },
    {
      "name": "Loki",
      "side": "villain"
    }
  ]
}

//도큐먼트 색인
PUT movie/_doc/3
{
  "title": "Avengers: Infinity War",
  "characters": [
    {
      "name": "Loki",
      "side": "superhero"
    },
    {
      "name": "Thanos",
      "side": "villain"
    }
  ]
}

//검색
POST movie/_search
{
  "query": {
    "nested": {
      "path": "characters",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "characters.name": "Loki"
              }
            },
            {
              "match": {
                "characters.side": "villain"
              }
            }
          ]
        }
      }
    }
  }
}
```
```json
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 1,
      "relation" : "eq"
    },
    "max_score" : 1.4480599,
    "hits" : [
      {
        "_index" : "movie",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.4480599,
        "_source" : {
          "title" : "The Avengers",
          "characters" : [
            {
              "name" : "Iron Man",
              "side" : "superhero"
            },
            {
              "name" : "Loki",
              "side" : "villain"
            }
          ]
        }
      }
    ]
  }
}
```

### `geo_point`

> Geo Point 는 위도(latitude)와 경도(longitude) 두 개의 실수 값을 가지고 지도 위의 한 점을 나타내는 값

```bash
//필드 세팅
PUT my_geo
{
  "mappings": {
    "properties": {
      "location": {
        "type": "geo_point"
      }
    }
  }
}

//도큐먼트 색인
PUT my_locations/_doc/1
{
  "location": {
    "lat": 41.12,
    "lon": -71.34
  }
}
```

엘라스틱 서치는 다양한 위치 검색 기능을 제공한다.

#### `geo_bounding_box` 쿼리

> geo_bounding_box 쿼리는 top_left 와 bottom_right 두 개의 옵션에 각각 위치점을 입력하고 이 점들을 토대로 그린 네모 칸 안에 위치하는 도큐먼트들을 불러옵니다.

```bash
POST my_geo/_search
{
  "query": {
    "geo_bounding_box": {
      "location": {
        "bottom_right": {
          "lat": 37.4899,
          "lon": 127.0388
        },
        "top_left": {
          "lat": 37.5779,
          "lon": 126.9617
        }
      }
    }
  }
}
```

![image](https://github.com/user-attachments/assets/c189364f-eb16-4985-866b-b7b851dbb120)


#### `geo_distance` 쿼리

> geo_distance 쿼리는 하나의 위치점을 찍고 distance 옵션을 이용해서 입력한 반경의 원 안에 있는 도큐먼트들을 불러옵니다

```bash
POST my_geo/_search
{
  "query": {
    "geo_distance": {
      "distance": "5km",
      "location": {
        "lat": 37.5358,
        "lon": 126.9559
      }
    }
  }
}
```

![image](https://github.com/user-attachments/assets/ad0a14e9-fdf5-4709-8808-3624c2c14490)


### `geo_shape`

`geo_point`는 1차원 점을 의미한다면, `geo_shape`는 차원을 더 확장하는 개념이다.
점, 선, 면, 여러 점, 여러 선, 여러 면 등의 타입을 지원한다.

`coordinates`는 경도, 위도 순이다.

```bash
//점
PUT my_shape/_doc/1
{
  "location": {
    "type": "point",
    "coordinates": [
      127.027926,
      37.497175
    ]
  }
}

//여러 점 
PUT my_shape/_doc/2
{
  "location": {
    "type": "multipoint",
    "coordinates": [
      [ 127.027926, 37.497175 ],
      [ 126.991806, 37.571607 ],
      [ 126.924191, 37.521624 ],
      [ 126.972559, 37.554648 ]
    ]
  }
}

//직선
PUT my_shape/_doc/3
{
  "location": {
    "type": "linestring",
    "coordinates": [
      [ 127.027926, 37.497175 ],
      [ 126.991806, 37.571607 ]
    ]
  }
}

//여러 직선
PUT my_shape/_doc/4
{
  "location": {
    "type": "multilinestring",
    "coordinates": [
      [
        [ 127.027926, 37.497175 ],
        [ 126.991806, 37.571607 ]
      ],
      [
        [ 126.924191, 37.521624 ],
        [ 126.972559, 37.554648 ]
      ]
    ]
  }
}

//다각형
PUT my_shape/_doc/5
{
  "location": {
    "type": "polygon",
    "coordinates": [
      [
        [ 127.027926, 37.497175 ],
        [ 126.991806, 37.571607 ],
        [ 126.924191, 37.521624 ],
        [ 126.972559, 37.554648 ],
        [ 127.027926, 37.497175 ]
      ]
    ]
  }
}

//여러 다각형형
PUT my_shape/_doc/6
{
  "location": {
    "type": "multipolygon",
    "coordinates": [
      [
        [
          [ 127.027926, 37.497175 ],
          [ 126.991806, 37.571607 ],
          [ 126.924191, 37.521624 ],
          [ 127.004943, 37.504810 ],
          [ 127.027926, 37.497175 ]
        ]
      ],
      [
        [
          [ 126.936893, 37.555134 ],
          [ 126.967894, 37.529170 ],
          [ 126.924191, 37.521624 ],
          [ 126.936893, 37.555134 ]
        ]
      ]
    ]
  }
}

//직사각형
PUT my_shape/_doc/7
{
  "location": {
    "type": "envelope",
    "coordinates": [
      [ 126.936893, 37.555134 ],
      [ 127.004943, 37.50481 ]
    ]
  }
}
```

#### geo_shape 쿼리

`geo_shape` 필드값을 갖는 도큐먼트를 검색하는 쿼리이다.

검색 대상이 도형이기 때문에 영역 기반으로 검색 기능을 제공한다.(`relation` 옵션)

- `relation`: 다양한 영역 기반 검색 모드 지정
  - `intersects`: 검색 도형과 필드 도형의 교차 영역이 존재하면 검색된다.
  - `disjoint`: 검색 도형과 필드 도형의 교차 영역이 없으면 검색된다. (필드 도형의 외부에 검색 도형이 있을 때를 의미)
  - `within`: 필드 도형이 검색 도형 안에 있으면 검색된다.

![image](https://github.com/user-attachments/assets/a91dd33c-a04c-4d52-a099-e88a84a7ee92)

```bash
GET my_shape/_search
{
  "query": {
    "geo_shape": {
      "location": {
        "shape": {
          "type": "geo_shape 타입",
          "coordinates": [
            [ 126.9687, 37.58 ],
            [ 126.99, 37.5543 ]
          ]
        },
        "relation": "intersects"
      }
    }
  }
}
```

### 멀티 필드

하나의 필드를 여러 개의 역인덱스와 `doc_values`를 만들기 위해 여러 개의 필드를 정의할 수 있다.

여러 개의 역인덱스를 만든다는 뜻은 멀티 필드로 여러 개의 애널라이저를 적용시킬 수 있다는 뜻이기도 하다.

```bash
PUT my_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "nori_analyzer": {
          "tokenizer": "nori_tokenizer"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "message": {
        "type": "text",
        "fields": {
          "english": {
            "type": "text",
            "analyzer": "english"
          },
          "nori": {
            "type": "text",
            "analyzer": "nori_analyzer"
          }
        }
      }
    }
  }
}
```

![image](https://github.com/user-attachments/assets/01686c57-655b-48a4-800d-ccc3cf4ca133)


mappings에서 정의한 이름으로 검색 쿼리시 `.`을 통해 세부 필드를 지정한다.

```
POST my_index/_search
{
  "query": {
    "match": {
      "message.nori": "영웅"
    }
  }
}
```

## Full Text Query

### `match_all` 쿼리

조건 없이 모든 도큐먼트를 조회한다.

### match 쿼리

공백을 기준으로 다른 키워드로 인식하여 검색한다. (OR 연산)

```bash
POST my_index/_search
{
  "query": {
    "match": {
      "message": "quick dog"
    }
  }
}
```

AND 연산으로 변경하려면 `operator` 옵션을 써야 한다.

```bash
POST my_index/_search
{
  "query": {
    "match": {
      "message": {
        "query": "quick dog",
        "operator": "and"
      }
    }
  }
}
```

### `match_phrase` 쿼리

공백을 포함한 문자열을 키워드로 인식하여 검색한다.

`slop` 옵션은 공백에 들어갈 수 있는 문자열 수를 지정한다.
예를 들어, lazy dog에 `slop = 1`을 주면 lazy jumping dog와 같은 문장도 검색된다.
`slop = 2`를 주면 lazy jumping crazy dog와 같은 문장도 검색된다.

```bash
POST my_index/_search
{
  "query": {
    "match_phrase": {
      "message": {
        "query": "lazy dog",
        "slop": 1
      }
    }
  }
}
```

### prefix 쿼리

앞글자가 일치하는 Term에 해당하는 도큐먼트를 검색한다.

```bash
POST autocomplete_test_1/_search
{
  "query": {
    "prefix": {
      "word": {
        "value": "추천"
      }
    }
  }
}
```

### fuzzy 쿼리

`fuzziness` 값에 따라 검색어를 변경,삭제,추가하면서 일치하는 Term에 해당하는 도큐먼트를 검색한다.
예를 들어, "스게팀임", "스팀께임", "스게임", "스!팀게임" 등의 검색어도 "스팀게임" Term에 매칭한다.

```bash
POST autocomplete_test_1/_search
{
  "query": {
    "fuzzy": {
      "word": {
        "value": "스!팀게임",  
        "fuzziness": 1
      }
    }
  }
}
```

### `match_phrase_prefix` 쿼리

`match_pharse` 처럼 공백을 포함한 문자열 전체를 키워드로 가져가지만, prefix 쿼리처럼 앞글자 매칭을 한다.

```bash
POST autocomplete_test_1/_search
{
  "query": {
    "match_phrase_prefix": {
      "word": "스팀게임 추"
    }
  }
}
```

## relevancy 

정확도라고 해석된다. (렐러번시)

검색 결과로 나온 각 도큐먼트가 얼마나 검색어에 부합하는지를 점수로 표현한다.

BM25라는 수학 공식으로 점수를 매긴다.

![image](https://github.com/user-attachments/assets/0bf8b7ba-98d3-4476-81ac-5d717c75e997)

핵심은 세 가지이다.

- TF (Term Frequency): 키워드가 도큐먼트 안에서 많이 나올 수록 가점한다.
- IDF (Inverse Document Frequency): 키워드가 매핑하는 도큐먼트가 많을 수록 해당 키워드의 도큐먼트는 감점한다. (흔한 키워드는 많이 감점하고, 특별한 키워드는 덜 감점한다)
- Field Length: 키워드가 발견된 필드의 길이가 작은만큼 가점한다.

## bool 쿼리

복합 쿼리이다.

- `must`: 쿼리를 만족하는 도큐먼트들을 검색한다.
- `must_not`: 쿼리를 만족하지 않는 도큐먼트들을 검색한다.
- `should`: 검색 결과 중 이 쿼리를 만족하는 도큐먼트의 점수를 높인다.
- `filter`: 쿼리를 만족하는 도큐먼트를 검색하지만 점수는 계산하지 않는다.


```bash
//quick과 lazy dog가 모두 포함된 도큐먼트를 찾는다.
POST my_index/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "message": "quick"
          }
        },
        {
          "match_phrase": {
            "message": "lazy dog"
          }
        }
      ]
    }
  }
}
```

`should`와 `match_phrase`를 사용하면 사용자의 검색어에 좀 더 부합하는 도큐먼트를 상위로 올릴 수 있다.

```bash
POST my_index/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "message": {
              "query": "lazy dog"
            }
          }
        }
      ],
      "should": [
        {
          "match_phrase": {
            "message": "lazy dog"
          }
        }
      ]
    }
  }
}
```

lazy나 dog을 포함하는 도큐먼트들이 검색 결과에 포함되지만, 그 중에서도 "lazy dog"을 정확히 포함하는 도큐먼트가 더 높은 점수를 받게 되어 검색 결과에서 상위에 위치하게 된다.


## Exact Value Query

렐러번시를 따지지 않고 오로지 쿼리가 만족하는지 여부만 확인한다.

### filter 쿼리

bool 쿼리 안에 filter 쿼리를 사용하면 쿼리가 추가되었지만 쿼리를 만족하는 도큐먼트를 가점하지 않는다.

검색 결과 랭킹에 영향을 주지 않으면서 불필요한 결과는 제거할 때 사용된다.

```bash
POST my_index/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "message": "fox"
          }
        }
      ],
      "filter": [
        {
          "match": {
            "message": "quick"
          }
        }
      ]
    }
  }
}
```

`must_not`을 써서 키워드가 들어간 도큐먼트를 제외하고 싶다면 filter 안에 bool을 또 넣어야 한다.

```bash
POST my_index/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "message": "fox"
          }
        }
      ],
      "filter": [
        {
          "bool": {
            "must_not": [
              {
                "match": {
                  "message": "dog"
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

filter 안에 넣은 검색 조건은 캐싱이 되기 때문에 이후 같은 쿼리르 수행하면 쿼리가 조금 더 빨라진다.

그래서 점수 계산이 필요하지 않은 쿼리라면 filter 안에 넣는 것이 좋다.

### keyword 쿼리

검색어와 정확하게 일치하는 문자열을 포함하는 도큐먼트를 찾는다.(대소문자, 공백 등도 정확히 일치해야 한다)

```bash
POST my_index/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "match": {
            "message.keyword": "Brown fox brown dog"
          }
        }
      ]
    }
  }
}
```

### range 쿼리

정수값이나 날짜에 대해 크기비교를 통해 범위에 포함되는 도큐먼트들을 검색한다.

```bash
POST phones/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 700,
        "lt": 900
      }
    }
  }
}
```

```bash
POST phones/_search
{
  "query": {
    "range": {
      "date": {
        "gt": "2016-01-01"
      }
    }
  }
}
```

경우에 따라 범위의 경계가 가깝거나 멀수록 점수를 다르게 줘야 하는 경우도 있다.
이 때는 [function_score 쿼리](https://www.elastic.co/guide/en/elasticsearch/reference/7.3/query-dsl-function-score-query.html) 를 사용한다.
