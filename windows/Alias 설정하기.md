## Windows Alias 설정하기

- powershell profile 파일 열기
```bash
notepad  $PROFILE
```

- alias 작성하기
```bash
function Kube-Ctl { & kubectl $args }
New-Alias -Name k -Value Kube-Ctl
```

## 참고

https://atelier-kakaru.tistory.com/43
