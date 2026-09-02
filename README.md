# Nerd

ERD를 시각적으로 설계하고 MySQL DDL을 export할 수 있도록 돕는 ERD 설계 서비스입니다.

이 README는 나중에 서비스를 사용하는 사람들을 위한 사용 설명서로 작성합니다. 개발자/AI 작업 규칙은 아래 문서를 참고합니다.

- AI 작업 규칙: `AGENTS.md`
- 제품/개발 컨텍스트: `.agents/context`

## 개발 서버 실행

Windows PowerShell 기준으로 프로젝트 루트에서 아래 명령을 실행합니다.

```powershell
npm install
npm.cmd run dev
```

Vite 개발 서버가 실행되면 터미널에 표시되는 `Local` 주소를 브라우저에서 엽니다.
기본 주소는 보통 `http://localhost:5173/`이며, 해당 포트가 이미 사용 중이면 `5174`처럼 다른 포트로 자동 실행될 수 있습니다.

개발 서버를 종료하려면 서버가 실행 중인 터미널에서 `Ctrl+C`를 누릅니다.
