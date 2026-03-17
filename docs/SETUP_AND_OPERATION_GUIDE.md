# IMAGE_PROJECT_MANAGE 실행 및 Custom GPT 연결 가이드

## 1. 문서 목적

이 문서는 현재 저장소의 MVP를 실제로 실행하고, 로컬 `mcp` 서버를 공개 HTTPS 주소로 노출한 뒤, ChatGPT의 Custom GPT에 Action으로 연결하여 실제 이미지 생성 및 자동 업로드까지 동작시키는 방법을 정리한 운영 가이드다.

이 문서에는 다음이 포함된다.

- 로컬 서버 실행 방법
- `mcp` / `webapp` 역할
- HTTPS 공개 주소 생성 방법
- Custom GPT 등록 및 Action import 방법
- 테스트 방법
- 실제 운영 중 자주 발생하는 오류와 원인

---

## 2. 현재 프로젝트 구조

이 MVP는 아래 3개 폴더를 기준으로 동작한다.

- `mcp/`
  백엔드 서버, SQLite DB, 업로드 API, MCP-style tool handler, 정적 파일 서빙 담당
- `customgpt/`
  Custom GPT Instructions, Action 연결 가이드, 수동 테스트 시나리오 담당
- `webapp/`
  업로드된 프로젝트 이미지와 상태를 보여주는 대시보드 담당

실제 동작 흐름은 아래와 같다.

1. Custom GPT가 `mcp`에서 프로젝트 목록과 이미지 생성 프롬프트를 읽는다
2. 사용자가 확인한다
3. Custom GPT가 이미지를 직접 생성한다
4. 생성 직후 `upload_generated_image`를 호출한다
5. `mcp`가 이미지를 로컬 디스크에 저장한다
6. `webapp`에서 저장된 이미지를 버튼으로 확인한다

---

## 3. 사전 준비

### 3.1 요구 사항

- Node.js 20+
- npm
- Homebrew
- ChatGPT 계정
- Custom GPT 편집 권한

현재 개발 환경에서는 아래 버전으로 확인했다.

- Node.js `v24.13.1`
- npm `11.8.0`

### 3.2 설치

루트에서 의존성을 설치한다.

```bash
cd /Users/hwanchoi/projects_202603/gpt_image_gen
npm install
```

---

## 4. 로컬 서버 실행 방법

### 4.1 MCP 서버 실행

첫 번째 터미널에서 실행:

```bash
cd /Users/hwanchoi/projects_202603/gpt_image_gen
npm run dev:mcp
```

실행 시 서버가 수행하는 일:

- Prisma client 생성
- SQLite 스키마 준비
- 로컬 DB 사용
- 업로드 API 제공
- `/storage/...` 정적 파일 서빙

기본 주소:

- `http://localhost:3000`

정상 확인:

```bash
curl http://localhost:3000/healthz
```

기대 응답:

```json
{"ok":true}
```

### 4.2 WebApp 실행

두 번째 터미널에서 실행:

```bash
cd /Users/hwanchoi/projects_202603/gpt_image_gen
npm run dev:webapp
```

기본 주소:

- `http://localhost:3001`

브라우저에서 열기:

- `http://localhost:3001`

### 4.3 프로젝트 목록 API 확인

```bash
curl http://localhost:3000/api/projects
```

이 API가 응답하면 MCP 서버는 기본적으로 정상이다.

---

## 5. HTTPS 공개 주소 생성 방법

Custom GPT Actions는 로컬 `http://localhost:3000`을 직접 호출할 수 없다. 따라서 외부에서 접근 가능한 공개 HTTPS 주소가 필요하다.

이번 MVP에서는 `Cloudflare Quick Tunnel`을 사용한다.

### 5.1 cloudflared 설치

```bash
brew install cloudflared
```

설치 확인:

```bash
cloudflared --version
```

### 5.2 Quick Tunnel 실행

```bash
cloudflared tunnel --url http://localhost:3000
```

정상적으로 실행되면 아래와 같은 주소가 출력된다.

```text
https://xxxxx.trycloudflare.com
```

예시:

```text
https://cooking-horses-optimal-journalism.trycloudflare.com
```

### 5.3 공개 주소 확인

```bash
curl https://cooking-horses-optimal-journalism.trycloudflare.com/healthz
```

정상 응답:

```json
{"ok":true}
```

### 5.4 중요한 주의사항

- Quick Tunnel 주소는 임시다
- 터널을 다시 열면 도메인이 바뀔 수 있다
- 도메인이 바뀌면 OpenAPI import URL도 다시 바꿔야 한다

---

## 6. OpenAPI 주소

현재 Action import에 사용하는 공개 OpenAPI 주소 형식은 아래와 같다.

```text
https://YOUR-TRYCLOUDFLARE-DOMAIN/openapi/custom-gpt-action.yaml
```

예시:

```text
https://cooking-horses-optimal-journalism.trycloudflare.com/openapi/custom-gpt-action.yaml
```

브라우저나 `curl`로 확인:

```bash
curl https://cooking-horses-optimal-journalism.trycloudflare.com/openapi/custom-gpt-action.yaml
```

이 파일 안의 `servers.url`도 같은 공개 주소를 가리켜야 한다.

---

## 7. Custom GPT 등록 방법

### 7.1 GPT 편집 화면 열기

브라우저에서 아래 주소로 이동:

```text
https://chatgpt.com/gpts/editor
```

### 7.2 Configure 탭 이동

등록 또는 수정할 GPT를 선택한 뒤 `Configure` 탭으로 이동한다.

### 7.3 Image Generation 활성화

`Capabilities`에서 아래 기능을 켠다.

- `Image Generation`

### 7.4 Instructions 입력

아래 파일 내용을 그대로 넣는다.

- `customgpt/instructions.md`

핵심 규칙:

- 프로젝트 목록은 `list_active_projects`로 읽는다
- 프롬프트는 `get_project_execution_context`로 읽는다
- 이미지 생성은 Custom GPT가 직접 한다
- 업로드는 `upload_generated_image`를 호출한다
- 업로드 시 생성된 파일이 반드시 `openaiFileIdRefs`로 첨부돼야 한다

### 7.5 Actions 추가

`Actions` 섹션으로 이동하여 새 Action을 추가한다.

`Import from URL`에 아래 주소를 넣는다.

```text
https://cooking-horses-optimal-journalism.trycloudflare.com/openapi/custom-gpt-action.yaml
```

### 7.6 import 후 확인할 Action

다음 3개가 보여야 한다.

- `list_active_projects`
- `get_project_execution_context`
- `upload_generated_image`

### 7.7 Starter prompts

아래 문장을 starter prompt로 넣으면 테스트가 편하다.

```text
현재 프로젝트 조회
첫 번째 프로젝트 이미지 생성해
24개 모두 생성해
```

### 7.8 저장

설정을 저장하고 GPT를 실행한다.

---

## 8. Custom GPT 테스트 방법

### 8.1 프로젝트 조회 테스트

GPT에 입력:

```text
현재 프로젝트 조회
```

정상 동작:

- 프로젝트 목록 출력
- 프로젝트 이름, 상태, 아이템 개수 표시

### 8.2 단건 생성 테스트

GPT에 입력:

```text
첫 번째 프로젝트 이미지 생성해
```

정상 동작:

1. GPT가 프로젝트와 다음 아이템의 프롬프트를 보여줌
2. 사용자 확인 후 이미지 생성
3. `upload_generated_image` 호출
4. 업로드 성공 메시지와 URL 또는 파일 경로 요약

### 8.3 배치 생성 테스트

GPT에 입력:

```text
24개 모두 생성해
```

정상 동작:

1. 첫 번째 아이템만 먼저 생성 및 업로드
2. GPT가 나머지 계속 여부 질문
3. 사용자가 승인하면 다음 아이템 반복

---

## 9. WebApp 확인 방법

브라우저에서:

```text
http://localhost:3001
```

확인 가능한 항목:

- 프로젝트 목록
- 프로젝트 상태
- 업로드된 아이템 수
- 프로젝트 상세
- 최근 로그
- 업로드된 이미지 보기 버튼

상세 화면에서는 각 아이템에 대해:

- 프롬프트
- 상태
- 업로드 시간
- 이미지 열기 버튼

를 확인할 수 있다.

---

## 10. 자주 발생하는 문제와 원인

### 10.1 `Cloudflare Tunnel error (1033)`

의미:

- 공개 터널이 끊겼거나
- 예전 `trycloudflare.com` 주소를 GPT가 아직 사용 중인 경우

확인 방법:

```bash
curl https://YOUR-TRYCLOUDFLARE-DOMAIN/healthz
```

조치:

- `cloudflared tunnel --url http://localhost:3000` 재실행
- 새 주소가 발급되면 Action import URL도 다시 갱신

### 10.2 `No upload payload provided`

의미:

- GPT가 이미지는 생성했지만
- `upload_generated_image` 호출 시 생성된 파일을 같이 보내지 않음

원인:

- `openaiFileIdRefs` 누락

조치:

- GPT Instructions를 최신본으로 반영
- Action을 다시 import
- 업로드 호출에 생성 이미지가 첨부되도록 재시도

### 10.3 `작업 세트에는 중복 도메인이 있을 수 없습니다`

의미:

- 같은 `trycloudflare.com` 도메인이 다른 Action 세트에 이미 등록됨

조치:

- 기존 Action을 수정하거나
- 새 Quick Tunnel 주소를 발급받아 다시 import

### 10.4 계속 확인 요청을 하는 문제

의미:

- 현재 Instructions에 승인형 흐름이 들어가 있기 때문

현재 규칙:

- 생성 전 사용자 확인
- 배치는 첫 번째 아이템 처리 후 계속 여부 질문

즉 이 동작은 오류가 아니라 현재 설계된 정책이다.

---

## 11. 실제 운영 순서 요약

가장 짧은 순서는 아래와 같다.

1. `npm install`
2. `npm run dev:mcp`
3. `npm run dev:webapp`
4. `cloudflared tunnel --url http://localhost:3000`
5. 공개 OpenAPI URL 확보
6. `https://chatgpt.com/gpts/editor` 열기
7. `Configure`에서 `Image Generation` 켜기
8. `customgpt/instructions.md` 내용 입력
9. Actions에 공개 OpenAPI URL import
10. `현재 프로젝트 조회`
11. `첫 번째 프로젝트 이미지 생성해`
12. `webapp`에서 업로드 결과 확인

---

## 12. 관련 파일

핵심 파일 경로:

- `mcp/openapi/custom-gpt-action.yaml`
- `customgpt/instructions.md`
- `customgpt/action-setup.md`
- `customgpt/test-scenarios.md`
- `webapp/app/page.tsx`
- `webapp/app/project/[id]/page.tsx`
- `docs/MVP_IMPLEMENTATION_CHECKLIST.md`

---

## 13. 권장 운영 메모

- Quick Tunnel 주소는 항상 바뀔 수 있으므로 오래 쓰는 운영에는 부적합하다
- 로컬 데모용으로만 사용한다
- 실제 장기 운영 시에는 고정 도메인 기반 배포로 옮기는 것이 안전하다
- Custom GPT의 동작이 이상하면 먼저 Action URL과 Instructions 최신 상태를 확인한다
