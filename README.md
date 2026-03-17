<h1 align="center">
  🤖 GPT Image Gen (MVP)
</h1>

<p align="center">
  <strong>OpenAI Custom GPT와 로컬 MCP 서버를 연결한 프로젝트형 자동 이미지 생성 및 관리 시스템</strong>
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white">
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-DB-003B57?logo=sqlite&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white">
</p>

<p align="center">
<img width="400" height="400" alt="스크린샷 2026-03-17 오후 9 49 34" src="https://github.com/user-attachments/assets/088e2a45-652b-481a-bd83-6c9f5a1af9b5" />
<img width="400" height="400" alt="스크린샷 2026-03-17 오후 9 49 54" src="https://github.com/user-attachments/assets/530f80e0-831b-43a9-964a-331a7762b3bc" />
</p>

---

## 📖 개요 (Overview)

이 프로젝트는 아래 흐름으로 동작하는 로컬 우선 MVP입니다.

1. **Custom GPT**가 `mcp` 서버에서 프로젝트 목록과 이미지 생성 프롬프트를 읽습니다.
2. 사용자가 생성 내용을 확인합니다.
3. Custom GPT가 이미지를 직접 생성합니다.
4. 생성 직후 `upload_generated_image` 액션으로 이미지를 업로드합니다.
5. `mcp` 서버가 파일을 로컬 디스크와 SQLite에 저장합니다.
6. `webapp`에서 프로젝트 상태와 업로드된 이미지를 확인합니다.

> 💡 **현재 MVP는 로컬 환경 기준이며, 외부 공개 주소는 `Cloudflare Quick Tunnel`로 임시 생성합니다.**

---

## 📁 폴더 구조 (Directory Structure)

- 🖥️ **`mcp/`**: API 서버, SQLite DB, 업로드 처리, 정적 파일 서빙, OpenAPI 문서
- 🧠 **`customgpt/`**: Custom GPT instructions, Action 연결 가이드, 수동 테스트 시나리오
- 📱 **`webapp/`**: 프로젝트 목록/상세/로그/이미지 보기 UI
- 📚 **`docs/`**: PRD, TRD, 구현 체크리스트, 상세 실행 가이드

---

## ✨ 현재 구현 범위 (Features)

- **`mcp`**: `list_active_projects`, `get_project_execution_context`, `upload_generated_image`
- **`webapp`**: 프로젝트 목록, 상세, 로그, 이미지 보기 버튼
- **`customgpt`**: GPT instructions, OpenAPI import 경로, 수동 운영 가이드

---

## ⚠️ 중요한 경계 (Architecture Boundaries)

- 🚫 **별도의 MCP GUI는 없습니다.**
- 👁️ 사람이 보는 UI는 **`webapp`만 있습니다.**
- ⚙️ `mcp`는 GUI가 아니라 **API/업로드 서버입니다.**
- 🎨 **이미지 생성은 서버가 아니라 반드시 Custom GPT가 수행합니다.**

---

## 🛠️ 기술 스택 (Tech Stack)

- **Backend**: Node.js 20+, Express, Prisma, SQLite
- **Frontend**: React 19, Next.js 15 App Router
- **Language**: TypeScript
- **Network**: Cloudflare Quick Tunnel

---

## 🚀 빠른 시작 (Quick Start)

### 1. 📦 설치

```bash
cd /Users/hwanchoi/projects_202603/gpt_image_gen
npm install
```

### 2. 🖥️ MCP 서버 실행

```bash
npm run dev:mcp
```
- **기본 주소**: `http://localhost:3000`
- **정상 확인**: `curl http://localhost:3000/healthz`

### 3. 📱 WebApp 실행

```bash
npm run dev:webapp
```
- **기본 주소**: `http://localhost:3001`

### 4. 🌐 공개 HTTPS 주소 생성

```bash
cloudflared tunnel --url http://localhost:3000
```
- **출력 예시**: `https://xxxxx.trycloudflare.com`

> ⚠️ **중요**: 이 주소는 임시 주소입니다. 터널을 다시 열면 도메인이 바뀔 수 있으며, 도메인이 바뀌면 Custom GPT Action import URL도 다시 바꿔야 합니다.

### 5. 🔗 OpenAPI import URL

- **형식**: `https://YOUR-TRYCLOUDFLARE-DOMAIN/openapi/custom-gpt-action.yaml`
- **예시**: `https://cooking-horses-optimal-journalism.trycloudflare.com/openapi/custom-gpt-action.yaml`

---

## 🤖 Custom GPT 연결 요약

1. [ChatGPT Editor](https://chatgpt.com/gpts/editor) 열기
2. **Configure** 탭 이동
3. **Image Generation** 켜기
4. `customgpt/instructions.md` 내용을 `Instructions`에 붙여넣기
5. **Actions**에서 `Import from URL` 선택
6. **공개 OpenAPI URL 입력**
7. 아래 액션 3개가 보이는지 확인 (`list_active_projects`, `get_project_execution_context`, `upload_generated_image`)

---

## 🧪 테스트 프롬프트

Custom GPT 연결 후 아래 순서로 테스트합니다.

1. `현재 프로젝트 조회`
2. `첫 번째 프로젝트 이미지 생성해`
3. `24개 모두 생성해`

---

## 💻 웹앱에서 확인할 수 있는 것

- 📋 프로젝트 목록 및 상태
- ✅ 완료 아이템 수
- 📝 아이템별 프롬프트
- ⏱️ 최근 로그
- 🖼️ 업로드된 이미지 보기 버튼

> 🌐 **웹앱 접속**: `http://localhost:3001`

---

## ⌨️ 자주 쓰는 명령 (Commands)

- **전체 테스트**: `npm run test`
- **전체 빌드**: `npm run build`
- **MCP 스모크 테스트**: `npm run smoke -w mcp`
  *(seed 프로젝트 조회 ➔ execution context 조회 ➔ 업로드 API 호출 ➔ 저장된 이미지 URL 확인)*

---

## 📚 문서 링크 (Documentation)

- 📖 [상세 실행/운영 가이드](./docs/SETUP_AND_OPERATION_GUIDE.md)
- ✅ [MVP 체크리스트](./docs/MVP_IMPLEMENTATION_CHECKLIST.md)
- 📄 [제품 요구사항 (PRD)](./docs/PRD.md)
- 📄 [기술 요구사항 (TRD)](./docs/TRD.md)
- 🧠 [Custom GPT instructions](./customgpt/instructions.md)
- ⚙️ [Custom GPT Action setup](./customgpt/action-setup.md)

---

## ❓ 자주 발생하는 문제 (Troubleshooting)

### 🔴 `Cloudflare Tunnel error (1033)`
- **원인**: Quick Tunnel 끊김 또는 예전 도메인을 GPT가 아직 사용 중
- **대응**: `cloudflared tunnel` 재실행 후 새 도메인으로 Action 다시 import

### 🔴 `No upload payload provided`
- **원인**: GPT가 이미지는 생성했지만 업로드 액션 호출 시 생성 파일을 같이 보내지 않음 (`openaiFileIdRefs` 누락)
- **대응**: `customgpt/instructions.md` 최신본 반영, Action 재import 후 다시 생성 및 업로드 재시도

### 🔴 웹앱 썸네일은 보이는데 이미지 보기 버튼이 안 열림
- **가장 유력한 원인**: 업로드 실패가 아니라 저장된 직접 접근용 URL과 현재 접근 환경이 불일치 (`BASE_URL`이 `localhost` 기준으로 저장된 경우)

### 🔴 GPT가 계속 확인 요청을 함
- **원인**: 단건은 생성 전 확인, 배치는 첫 아이템 처리 후 계속 여부 확인하는 승인형 흐름이 정상 정책임. 오류가 아닙니다.

---

## 📌 현재 상태 요약

- ✅ `mcp` 구현 완료
- ✅ `webapp` 구현 완료
- ✅ `customgpt` 문서/설정 아티팩트 완료
- ✅ 루트 `npm run test`, `npm run build` 통과
- ✅ `mcp` 스모크 테스트 통과

---

## 📝 권장 운영 메모

> 💡 **Quick Tunnel은 데모/개발용으로만 사용합니다.** 장기 운영 시에는 고정 HTTPS 도메인을 갖는 배포 환경으로 옮기는 것이 안전합니다. Quick Tunnel 주소가 바뀌면 OpenAPI import URL과 `servers.url`도 같이 갱신해야 합니다.
