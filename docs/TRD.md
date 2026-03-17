# ⚙️ Technical Requirements Document (TRD)

## 아키텍처
User → Custom GPT(Image Generation) → MCP/Upload API → Service → DB/Storage → WebApp

## 기술 스택
- Node.js + TypeScript
- Express
- Prisma
- SQLite/PostgreSQL
- HTTP(S) file storage 또는 object storage

## MCP Tools
- list_active_projects
- get_project_execution_context
- upload_generated_image
- update_project_result
- append_project_log

## API
GET /api/projects
GET /api/project/:id
GET /api/logs
POST /api/upload-generated-image

## 상태 머신
pending → in_progress → completed

## 파일 저장
/storage/items/{project_id}/{item_id}.png

## 실행 원칙
- 이미지 생성은 서버가 아니라 Custom GPT의 Image Generation capability에서 수행한다
- Custom GPT는 생성 전 MCP에서 프로젝트 상세와 이미지 생성 프롬프트를 읽어온다
- GPT는 프로젝트 내용을 사용자에게 보여준 뒤 확인을 받고 이미지를 생성한다
- 생성 완료 후 결과 이미지는 자동으로 업로드된다
- 업로드 대상은 프로젝트에 연결된 WebApp Server의 HTTP(S) endpoint다
- 배치 생성은 첫 번째 아이템을 먼저 처리한 뒤, 나머지 계속 여부를 확인하는 순차형 흐름이다

## 단건 실행 흐름
1. Custom GPT가 `list_active_projects`를 호출하거나 현재 선택된 프로젝트를 사용한다
2. Custom GPT가 `get_project_execution_context`로 프로젝트 상세, 생성 프롬프트, 업로드 경로를 조회한다
3. GPT가 프로젝트 작업 내용과 생성 프롬프트를 사용자에게 보여주고 확인을 받는다
4. Custom GPT가 대화 내에서 이미지를 직접 생성한다
5. Custom GPT가 `upload_generated_image`를 호출해 생성 결과를 자동 업로드한다
6. 서버가 WebApp Server 디렉터리에 파일을 저장하고 DB 상태 및 로그를 업데이트한다
7. GPT가 최종 저장 결과와 파일 경로/URL을 요약한다

## 배치 실행 흐름
1. GPT가 프로젝트 요약과 함께 전체 실행 여부를 확인한다
2. 첫 번째 아이템의 생성 프롬프트와 업로드 정보를 조회한다
3. 첫 번째 아이템 이미지를 생성하고 자동 업로드를 완료한다
4. GPT가 나머지 아이템 계속 처리 여부를 확인한다
5. 사용자가 계속을 선택하면 남은 아이템도 같은 방식으로 조회 → 생성 → 자동 업로드를 순차 처리한다
6. 각 저장 결과를 누적 기록하고 사용자에게 진행 상황을 요약한다

## API 역할
- `get_project_execution_context`
  입력: `projectId`, 선택적 `itemId`
  처리: 프로젝트 설명, 이미지 생성 프롬프트, 업로드 대상 경로/URL 반환
  출력: `project`, `items`, `prompt`, `uploadTarget`
- `upload_generated_image`
  입력: `projectId`, `itemId`, GPT 생성 결과 참조
  처리: 생성된 이미지를 WebApp Server 디렉터리에 저장, 상태 업데이트, 로그 기록
  출력: `success`, `assetPath|imageUrl`, `projectId`, `itemId`

## WebApp 역할
- 프로젝트별 업로드 이미지를 조회한다
- 저장된 디렉터리의 이미지를 버튼 클릭으로 열람할 수 있다
- 프로젝트 상태와 최근 업로드 결과를 표시한다
