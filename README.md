# 딴짓.os

> 할일 안 하고 옆길로 새는 토이 프로젝트 모음 OS

---

## Apps

| 아이콘 | ID        | 이름                                                      | 상태      | What it does                                                        |
| :----: | --------- | --------------------------------------------------------- | --------- | ------------------------------------------------------------------- |
|   🪨   | `stones`  | **사랑하는아이에게돌을던져보세요....exe**                 | ✅ 배포   | 제물(이미지) 올려 돌·하트·별 던지고 GIF로 저장. 투명 여백 자동 크롭 |
|   📝   | `tangent` | **딴생각아카이브.txt**                                    | 🔧 개발중 | 떠오른 딴생각을 적어두고, "무작위로 보여줘"로 다시 만나기           |
|   🎨   | `paint`   | **절대 바이러스 아닙니다. 믿어주세요... 전 그림판입니다** | 🔧 개발중 | 진짜 그림판. 진짜요.                                                |
|   🛁   | `bath`    | **사랑하는아이를목욕시켜보세요....exe**                   | 🔧 개발중 | 제물을 목욕시키는 물 시뮬레이션 (전체화면)                          |
|   🔧   | —         | **준비중 × 1**                                            | 🔧 준비중 | 데스크톱 슬롯이 미래의 앱을 기다리는 중                             |

> 실제 아이콘은 pixel-art PNG. `src/shared/icons/` 참고.
>
> **현재 상태**: `stones`만 `develop`에 올라가 Vercel 배포됨. `tangent`·`paint`·`bath`는 개발 중(로컬 보존, 미배포). 활성 앱은 `src/app/config.ts`의 `APPS` 배열로 관리.

---

## 테마

Start 메뉴 → 테마 변경에서 선택. `data-theme` 속성으로 전환.

| ID          | 이름                |
| ----------- | ------------------- |
| `win98`     | 기본 (Windows 98)   |
| `cream`     | 크림 종이 / Cream   |
| `gameboy`   | 게임보이 / Game Boy |
| `crt`       | CRT 단말기 / CRT    |
| `bubblegum` | 버블껌 / Bubblegum  |
| `blueprint` | 청사진 / Blueprint  |

---

## 실행

패키지 매니저는 **Yarn 4** (`packageManager` 고정).

```bash
yarn install

yarn dev           # 개발 서버 (localhost:3000)
yarn build         # 프로덕션 빌드
yarn start         # 빌드 결과 실행
yarn storybook     # Storybook (localhost:6006)
yarn typecheck     # 타입 체크 (tsc --noEmit)
yarn test          # 단위 테스트 (vitest)
yarn test:e2e      # E2E (playwright)
yarn lint          # ESLint 검사
```

---

## 아키텍처

**OS Shell + Mini-apps** — "OS 위에서 돌아가는 앱들"이라는 프로젝트 개념을 그대로 폴더 구조로 표현. ([Screaming Architecture](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html) + Domain 구조)

### 폴더 구조

```
src/
├── app/              # Next.js App Router, 전역 설정, 테마
│   └── api/memos/    # Memo REST API
│
├── os/               # OS 껍데기 — 앱과 독립된 OS UI
│   ├── desktop/      # 바탕화면 (아이콘, sticky 메모)
│   └── taskbar/      # 태스크바 & Start 메뉴
│
├── applications/     # 각 미니앱 (완전 독립)
│   ├── stones/       # 돌 던지기 (StoneThrower, GIF 녹화) — model/ui 분리
│   ├── paint/        # 그림판 (PaintApp, PaintCanvas)        — 개발중
│   ├── tangent/      # 딴생각아카이브 (TangentArchive)        — 개발중
│   │   └── memo/     # 메모 카드 컴포넌트
│   └── bath/         # 목욕 (BathApp, 물 시뮬레이션)          — 개발중
│
└── shared/           # 진짜 공용 코드만
    ├── ui/           # button, window, dialog, icon, menubar, status-bar, form-field
    ├── icons/        # pixel-art 아이콘 레지스트리
    ├── lib/          # 유틸 (cx, resolveIcon)
    ├── styles/       # 토큰, 폰트, 리셋, 믹스인
    └── types/        # AppDef, Memo 등 공용 타입
```

> 폴더 import alias는 `@/` = `src/`. 예: `@/applications/stones`, `@/shared/ui/button`.

### 규칙

- `applications/` 각 앱은 서로 import 금지 — 독립 실행 가능해야 함
- `os/`는 앱의 내용 모름 — `AppDef` 타입으로만 소통
- `shared/`는 비즈니스 로직 없는 순수 UI·유틸만
- 새 앱 추가 = `applications/` 에 폴더 하나, `app/config.ts`에 `AppDef` 등록

```typescript
// app/page.tsx — OS가 앱을 조합하는 방식
import { OsDesktop } from '@/os/desktop';
import { Taskbar } from '@/os/taskbar';
import { StoneThrower } from '@/applications/stones';
import { Window } from '@/shared/ui/window';
```

### 배치 기준

| 상황                                | 위치                           |
| ----------------------------------- | ------------------------------ |
| OS UI (바탕화면, 태스크바, 창 크롬) | `os/`                          |
| 미니앱 전체                         | `applications/{앱명}/`         |
| 앱 전체에서 재사용하는 UI 원자      | `shared/ui/`                   |
| 공용 타입·유틸                      | `shared/types/`, `shared/lib/` |

---

## 코딩 규칙

### 린트 & 포맷 도구

| 도구                             | 역할                                      | 실행 시점           |
| -------------------------------- | ----------------------------------------- | ------------------- |
| **ESLint** (`eslint.config.mjs`) | 코드 오류, `any` 금지                     | `git commit` (자동) |
| **Prettier** (`.prettierrc`)     | 코드 포맷 통일                            | `git commit` (자동) |
| **Husky**                        | git pre-commit hook 실행                  | `git commit` (자동) |
| **lint-staged**                  | staged 파일만 걸러서 ESLint·Prettier 적용 | `git commit` (자동) |

`git commit` 시 자동 실행 흐름:

```
git commit → lint-staged → ESLint --fix → Prettier --write → 커밋 완료
```

### Import 순서

```typescript
// 1. 외부 라이브러리
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. 내부 절대 경로
import { Button } from '@/shared/ui/button';
import { iconUrl } from '@/shared/icons';

// 3. 상대 경로
import { gameReducer } from '../model/reducer';

// 4. 타입
import type { AppDef } from '@/shared/types';

// 5. 스타일
import styles from './Component.module.scss';
```

그룹 사이 빈 줄 필수.

### 명명 규칙

| 대상            | 규칙             | 예시                      |
| --------------- | ---------------- | ------------------------- |
| 변수/함수       | camelCase        | `userName`, `handleClick` |
| 컴포넌트        | PascalCase       | `Button`, `ReviewCard`    |
| 상수            | UPPER_SNAKE_CASE | `MAX_LENGTH`, `API_URL`   |
| 디렉토리        | kebab-case       | `user-profile`            |
| 타입/인터페이스 | PascalCase       | `User`, `ButtonProps`     |

### Prettier 설정

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all"
}
```

### TypeScript — `any` 금지

```typescript
// ❌
function processData(data: any) { ... }

// ✅ 구체적 타입
function processData(data: Data) { ... }

// ✅ 제네릭
function processData<T>(data: T) { ... }

// ✅ 타입 모를 때 → unknown + 타입 가드
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

---

## 배포

- **호스팅**: Vercel
- **Production Branch**: `develop` — 푸시 시 자동 빌드·배포
- **빌드**: `next build` (App Router · 정적 페이지 + `/api/memos` 동적 라우트)

> Git Flow상 `main`이 프로덕션이지만, 현재 Vercel Production Branch는 `develop`으로 지정돼 있음 (Vercel → Settings → Git → Production Branch).

---

## 협업 가이드

### 브랜치 전략 (Git Flow)

| 브랜치      | 역할                                                    |
| ----------- | ------------------------------------------------------- |
| `main`      | 프로덕션. 직접 커밋 금지. `develop`/`hotfix`에서만 병합 |
| `develop`   | 다음 릴리스 통합                                        |
| `feature/*` | 새 기능 개발 (`feature` → `develop`)                    |
| `hotfix/*`  | 프로덕션 긴급 수정 (`main` → `main` + `develop`)        |

```bash
# 기능 개발 플로우
git checkout develop && git pull origin develop
git checkout -b feature/new-feature

# ... 작업 ...

git push origin feature/new-feature
# → GitHub에서 feature/new-feature → develop PR 생성
```

### 커밋 컨벤션

```
<type>: <subject>
```

> **scope 사용 금지** — `fix(image):` 형식 쓰지 말 것. `type: 메시지` 형식만.

| type       | 설명                           |
| ---------- | ------------------------------ |
| `feat`     | 새 기능 추가                   |
| `fix`      | 버그 수정                      |
| `docs`     | 문서 추가/수정                 |
| `style`    | 코드 포맷팅 (동작 영향 없음)   |
| `refactor` | 리팩터링                       |
| `test`     | 테스트 코드                    |
| `chore`    | 빌드, 패키지, 설정, 워크플로우 |
| `ci`       | CI/CD 설정                     |

```bash
# ✅
git commit -m "feat: 사용자 로그인 기능 추가"
git commit -m "fix: 리뷰 작성 오류 수정"
git commit -m "chore: dev 스크립트 webpack으로 변경 및 워크플로우 정비"

# ❌ scope 금지
git commit -m "fix(image): 업로드 오류 수정"

# ❌ 형식 미준수
git commit -m "added login feature"
```

commitlint + Husky로 자동 검증.

---

## 라이선스

- Mona 폰트: [SIL Open Font License 1.1](LICENSE-Mona.txt) — © 2025 Monad ABXY
