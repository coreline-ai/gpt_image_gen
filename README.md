# GPT Image Gen (MVP)

OpenAI Custom GPT와 로컬 MCP 서버를 연결해 프로젝트형 이미지 생성과 자동 업로드를 수행하고, 웹앱에서 결과를 확인하는 로컬 우선 MVP입니다.

## 개요

이 프로젝트는 아래 흐름으로 동작합니다.

1. Custom GPT가 `mcp` 서버에서 프로젝트 목록과 이미지 생성 프롬프트를 읽습니다.
2. 사용자가 생성 내용을 확인합니다.
3. Custom GPT가 이미지를 직접 생성합니다.
4. 생성 직후 `upload_generated_image` 액션으로 이미지를 업로드합니다.
5. `mcp` 서버가 파일을 로컬 디스크와 SQLite에 저장합니다.
6. `webapp`에서 프로젝트 상태와 업로드된 이미지를 확인합니다.

현재 MVP는 로컬 환경 기준이며, 외부 공개 주소는 `Cloudflare Quick Tunnel`로 임시 생성합니다.

## 폴더 구조

- `mcp/`
  API 서버, SQLite DB, 업로드 처리, 정적 파일 서빙, OpenAPI 문서
- `customgpt/`
  Custom GPT instructions, Action 연결 가이드, 수동 테스트 시나리오
- `webapp/`
  프로젝트 목록/상세/로그/이미지 보기 UI
- `docs/`
  PRD, TRD, 구현 체크리스트, 상세 실행 가이드

## 현재 구현 범위

- `mcp`
  `list_active_projects`, `get_project_execution_context`, `upload_generated_image`
- `webapp`
  프로젝트 목록, 상세, 로그, 이미지 보기 버튼
- `customgpt`
  GPT instructions, OpenAPI import 경로, 수동 운영 가이드

## 중요한 경계

- 별도의 MCP GUI는 없습니다.
- 사람이 보는 UI는 `webapp`만 있습니다.
- `mcp`는 GUI가 아니라 API/업로드 서버입니다.
- 이미지 생성은 서버가 아니라 반드시 Custom GPT가 수행합니다.

## 기술 스택

- Node.js 20+
- TypeScript
- Express
- Prisma
- SQLite
- React 19
- Next.js 15 App Router
- Cloudflare Quick Tunnel

## 빠른 시작

### 1. 설치

```bash
cd /Users/hwanchoi/projects_202603/gpt_image_gen
npm install
```

### 2. MCP 서버 실행

```bash
npm run dev:mcp
```

기본 주소:

- `http://localhost:3000`

정상 확인:

```bash
curl http://localhost:3000/healthz
```

### 3. WebApp 실행

```bash
npm run dev:webapp
```

기본 주소:

- `http://localhost:3001`

### 4. 공개 HTTPS 주소 생성

```bash
cloudflared tunnel --url http://localhost:3000
```

출력 예시:

```text
https://xxxxx.trycloudflare.com
```

중요:

- 이 주소는 임시 주소입니다.
- 터널을 다시 열면 도메인이 바뀔 수 있습니다.
- 도메인이 바뀌면 Custom GPT Action import URL도 다시 바꿔야 합니다.

### 5. OpenAPI import URL

형식:

```text
https://YOUR-TRYCLOUDFLARE-DOMAIN/openapi/custom-gpt-action.yaml
```

예시:

```text
https://cooking-horses-optimal-journalism.trycloudflare.com/openapi/custom-gpt-action.yaml
```

## Custom GPT 연결 요약

1. `https://chatgpt.com/gpts/editor` 열기
2. `Configure` 탭 이동
3. `Image Generation` 켜기
4. `customgpt/instructions.md` 내용을 `Instructions`에 붙여넣기
5. `Actions`에서 `Import from URL` 선택
6. 공개 OpenAPI URL 입력
7. 아래 액션 3개가 보이는지 확인

액션 목록:

- `list_active_projects`
- `get_project_execution_context`
- `upload_generated_image`

## 테스트 프롬프트

Custom GPT 연결 후 아래 순서로 테스트합니다.

```text
현재 프로젝트 조회
```

```text
첫 번째 프로젝트 이미지 생성해
```

```text
24개 모두 생성해
```

## 웹앱에서 확인할 수 있는 것

- 프로젝트 목록
- 프로젝트 상태
- 완료 아이템 수
- 아이템별 프롬프트
- 최근 로그
- 업로드된 이미지 보기 버튼

웹앱 주소:

- `http://localhost:3001`

## 자주 쓰는 명령

### 전체 테스트

```bash
npm run test
```

### 전체 빌드

```bash
npm run build
```

### MCP 스모크 테스트

```bash
npm run smoke -w mcp
```

이 스모크 테스트는 아래 흐름을 확인합니다.

- seed 프로젝트 조회
- execution context 조회
- 업로드 API 호출
- 저장된 이미지 URL 확인

## 문서 링크

- 상세 실행/운영 가이드:
  [docs/SETUP_AND_OPERATION_GUIDE.md](/Users/hwanchoi/projects_202603/gpt_image_gen/docs/SETUP_AND_OPERATION_GUIDE.md)
- MVP 체크리스트:
  [docs/MVP_IMPLEMENTATION_CHECKLIST.md](/Users/hwanchoi/projects_202603/gpt_image_gen/docs/MVP_IMPLEMENTATION_CHECKLIST.md)
- 제품 요구사항:
  [docs/PRD.md](/Users/hwanchoi/projects_202603/gpt_image_gen/docs/PRD.md)
- 기술 요구사항:
  [docs/TRD.md](/Users/hwanchoi/projects_202603/gpt_image_gen/docs/TRD.md)
- Custom GPT instructions:
  [customgpt/instructions.md](/Users/hwanchoi/projects_202603/gpt_image_gen/customgpt/instructions.md)
- Custom GPT Action setup:
  [customgpt/action-setup.md](/Users/hwanchoi/projects_202603/gpt_image_gen/customgpt/action-setup.md)

## 자주 발생하는 문제

### `Cloudflare Tunnel error (1033)`

원인:

- Quick Tunnel 끊김
- 예전 도메인을 GPT가 아직 사용 중

대응:

- `cloudflared tunnel --url http://localhost:3000` 재실행
- 새 도메인으로 Action 다시 import

### `No upload payload provided`

원인:

- GPT가 이미지는 생성했지만 업로드 액션 호출 시 생성 파일을 같이 보내지 않음
- 즉 `openaiFileIdRefs` 누락

대응:

- `customgpt/instructions.md` 최신본 반영
- Action 재import
- 다시 생성 후 업로드 재시도

### 웹앱 썸네일은 보이는데 이미지 보기 버튼이 안 열림

가장 유력한 원인:

- 업로드 실패가 아니라 저장된 직접 접근용 URL과 현재 접근 환경이 불일치
- 특히 `BASE_URL`이 `localhost` 기준으로 저장돼 있으면 새 탭에서 기대와 다르게 열릴 수 있음

### GPT가 계속 확인 요청을 함

원인:

- 현재 Instructions가 승인형 흐름으로 작성돼 있음
- 단건은 생성 전 확인
- 배치는 첫 아이템 처리 후 계속 여부 확인

즉 오류가 아니라 현재 정책입니다.

## 현재 상태 요약

- `mcp` 구현 완료
- `webapp` 구현 완료
- `customgpt` 문서/설정 아티팩트 완료
- 루트 `npm run test`, `npm run build` 통과
- `mcp` 스모크 테스트 통과

## 권장 운영 메모

- Quick Tunnel은 데모/개발용으로만 사용합니다.
- 장기 운영 시에는 고정 HTTPS 도메인을 갖는 배포 환경으로 옮기는 것이 안전합니다.
- Quick Tunnel 주소가 바뀌면 OpenAPI import URL과 `servers.url`도 같이 갱신해야 합니다.
