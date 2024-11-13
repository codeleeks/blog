## 필요 패키지

```go
import (
	"net/http"
	"github.com/gin-gonic/gin"
	admissionv1 "k8s.io/api/admission/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	log "k8s.io/klog/v2"
)
```

- gin: 웹 프레임워크
- admissionv1: 어드미션 리뷰, 리퀘스트, 리스폰스 등의 객체 사용을 위해 임포트
- metav1: 어드미션 리스폰스의 스테이터스에 값을 넣을 때 객체 필요
- log: fmt보다 조금 더 나은 로깅 라이브러리


## kubernets 설정하기

k8s에는 기본적으로 admission control 기능이 disable 되어 있다.

기능을 사용하려면 API서버의 파라미터를 변경해야 한다. ([공식 독스](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#how-do-i-turn-on-an-admission-controller))

어드미션 컨트롤 기능은 여러 종류이므로, 필요에 맞는 기능을 켠다.

내 경우에는 `ValidatingAdmissionWebhook`를 enable했다.

### kind 설정하기

kind에서 API서버 파라미터를 변경하기 위해서는 클러스터를 삭제하고 다시 시작해야 한다.

kind는 커스텀한 설정은 yaml을 통해 설정하도록 제공한다.

그래서 어드미션 컨트롤 기능도 yaml을 통해 정의하면 된다.

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: k8s
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: ClusterConfiguration
    apiServer:
      extraArgs:
        enable-admission-plugins: ValidatingAdmissionWebhook
```

[kind 공식 독스](https://kind.sigs.k8s.io/docs/user/quick-start) 에도 잘 나와 있다.

## 인증서 만들기

어드미션 컨트롤 기능은 API서버가 외부 웹훅 서버의 리뷰 요청을 하는 구조이다.
API서버와 웹훅 서버 간의 보안 연결을 위해 인증서를 등록하는 과정이 필수적이다.

여기서 API서버는 일반적인 브라우저(클라이언트)의 입장이고, 웹훅 서버는 일반적인 HTTPS 서버의 입장이다.
따라서 API서버는 CA 인증서를, 웹훅 서버는 서버인증서와 키를 갖고 있어야 한다. 또한, 서버 인증서는 API서버가 갖고 있는 CA 인증서로 사인받은 상태여야 한다.

아래는 self-signed CA를 만들고, 이를 바탕으로 서버 인증서를 만드는 과정이다.

```bash
#!/bin/bash

openssl genrsa -out ca.key 2048
openssl req -x509 -new -nodes -key ca.key -days 10000 -out ca.crt -subj "/CN=admission_ca"

cat >server.conf <<EOF
[req]
req_extensions = v3_req
distinguished_name = req_distinguished_name
prompt = no
[req_distinguished_name]
CN = webhook.default.svc
[ v3_req ]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = webhook.default.svc
EOF

openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr -config server.conf
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 10000 -extensions v3_req -extfile server.conf
```

kubeadm으로 클러스터를 구축하면 /etc/kubernetes/ssl 경로에 쿠버네티스의 root CA 인증서가 있다고 한다.
self-signed ca가 아니라 쿠버네티스의 root ca를 이용해도 좋을 것 같다.

## validationwebhookconfiguration 리소스 등록하기

리소스 요청시 pass/fail을 결정할 수 있는 validationwebhookconfiguration 리소스를 등록한다.

웹훅은 정해진 포맷(AdmissionReview)으로 리뷰 요청을 받고, 리뷰 결과를 API서버에 보낸다.
이 때, 어떤 리소스 요청에 대해 리뷰를 받을지, 웹훅 서버의 엔드포인트와 경로 등을 설정한다.

`caBundle`에 root ca의 내용을 적는다. 이 때 base64로 인코딩해야 한다.

```yaml
# validatingwebhook.yaml
kind: ValidatingWebhookConfiguration
apiVersion: admissionregistration.k8s.io/v1
metadata:
  name: val-webhook
webhooks:
  - name: val-webhook.coffeewhale.com
    namespaceSelector:
      matchExpressions:
      - key: openpolicyagent.org/webhook
        operator: NotIn
        values:
        - ignore
    rules:
      - operations: ["CREATE"]
        apiGroups: ["*"]
        apiVersions: ["*"]
        resources: ["pods"]
    clientConfig:
      caBundle: $(cat ca.crt | base64 | tr -d '\n')
      service:
        namespace: default
        name: webhook
        path: /review
    admissionReviewVersions: ["v1"]
```

## 웹훅 서버 개발하기

```go
package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	resty "github.com/go-resty/resty/v2"
	admissionv1 "k8s.io/api/admission/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	log "k8s.io/klog/v2"
)

type Review struct {
	Id   string `json:"id"`
	Repo string `json:"repo"`
	Tag  string `json:"tag"`
}



var hash = map[string]string{
	"h": "sha256:2af505",
}

var client = resty.New()

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {

		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	r.POST("/review", func(c *gin.Context) {

		review := admissionv1.AdmissionReview{}
		responseReview := admissionv1.AdmissionReview{}
		response := admissionv1.AdmissionResponse{}

		if err := c.ShouldBind(&review); err == nil {
			log.Infof("binding passed - %v", review.Request.UID)
			
			response.UID = review.Request.UID
			response.Allowed = false

			response.Result = &metav1.Status{
				Code: 401,
				Message: "fire! worked great!!",
			}

			responseReview.Response = &response
			responseReview.Kind = review.Kind
			responseReview.APIVersion = review.APIVersion

			c.JSON(http.StatusOK, responseReview)
		} else {
			log.Errorf("binding failed - %v", err)
			response.UID = review.Request.UID
			response.Allowed = false
			response.Result = &metav1.Status{
				Code: 500,
				Message: "something wrong happened",
			}

			responseReview.Response = &response
			responseReview.Kind = "AdmissionReview"
			responseReview.APIVersion = "admission.k8s.io/v1"
			
			c.JSON(http.StatusOK, responseReview)
		}

	})
	r.RunTLS("0.0.0.0:8888", "server.crt", "server.key") // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}

func reviewPod(r Review) bool {
	odp := hash[r.Id]
	d := getDigest(r.Repo, r.Tag)
	return strings.HasPrefix(d, odp)
}

func getDigest(repo string, tag string) string {
	resp, _ := client.R().EnableTrace().
		SetHeader("Accept", "application/vnd.docker.distribution.manifest.v2+json").
		Get("http://localhost:5000/v2/" + repo + "/manifests/" + tag)

	digest := ""
	if resp.IsSuccess() {
		digest = resp.Header().Get("Docker-Content-Digest")
		fmt.Println(digest)
	} else {
		fmt.Println(resp.Error())
	}

	return digest
}

```

## 디플로이

먼저, 웹훅 서버를 디플로이 한다.

```yaml
kind: Service
apiVersion: v1
metadata:
  name: webhook
  namespace: default
spec:
  selector:
    app: webhook
  ports:
  - name: https
    protocol: TCP
    port: 443
    targetPort: 8888
---
apiVersion: v1
kind: Pod
metadata:
  name: webhook
  labels:
    app: webhook
spec:
  containers:
  - name: webhook
    image: docker.io/library/v:1
    ports:
    - containerPort: 8888
      protocol: TCP
```

그리고, validationwebhookconfiguration 리소스를 디플로이한다.


## 결과

```bash
Error from server: admission webhook "val-webhook.coffeewhale.com" denied the request: fire! worked great!!
```
