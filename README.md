# Nerd

테이블과 복합키 관계를 시각적으로 설계하고 MySQL DDL을 내보내는 프론트엔드 ERD 편집기입니다.

## 실행

Node.js와 npm이 설치된 환경에서 실행합니다. Windows PowerShell 기준입니다.

```powershell
npm.cmd ci
npm.cmd run dev
```

터미널에 표시되는 Local 주소를 엽니다. 기본 주소는 `http://localhost:5173/`입니다. 종료하려면 `Ctrl+C`를 누릅니다.

## 사용법

1. **테이블 추가**로 새 테이블을 만들고 캔버스에서 드래그해 배치합니다. 빈 공간을 드래그하면 이동하고 휠 또는 캔버스 버튼으로 확대·축소합니다.
2. 테이블을 선택하고 보조 패널에서 물리명·논리명·코멘트를 입력한 뒤 **테이블 적용**을 누릅니다.
3. **컬럼 추가** 후 각 컬럼의 이름, 타입, NULL 허용 여부, 코멘트를 편집하고 **컬럼 적용**을 누릅니다.
4. **기본키 (PK)**에서 컬럼을 체크한 순서대로 단일키 또는 복합키를 설정합니다. **기본키 적용**을 누르면 PK 컬럼은 NOT NULL이 됩니다. 모두 해제하고 적용하면 PK를 제거합니다.
5. **관계 설정**에서 FK 소유 테이블과 참조 대상 테이블을 선택합니다. 참조 대상 PK 순서에 맞춰 FK 컬럼을 하나씩 지정한 뒤 관계 종류를 선택하고 **관계 추가**를 누릅니다. 관계선 또는 목록을 선택하면 수정·삭제할 수 있습니다.
6. **테이블 검색**은 물리명과 논리명을 검색합니다. 결과를 선택하면 해당 위치로 이동하며, 숨긴 테이블도 다시 표시됩니다. 표시 옵션은 화면에 보이는 컬럼 정보를 제어합니다.
7. **MySQL DDL 내보내기**에서 결과를 확인하고 복사하거나 `erd.sql`로 다운로드합니다. 오류가 있으면 안내된 항목을 수정해야 합니다.

물리명은 영문 또는 밑줄로 시작하는 영문·숫자·밑줄 64자 이내입니다. 테이블과 컬럼 이름은 대소문자를 구분하지 않고 중복을 검사합니다. 테이블·컬럼 삭제 시 연결된 관계가 제거됩니다. 관계만 삭제하면 컬럼과 참조 PK는 유지됩니다.

## MVP 범위

- 단일 편집 화면 `/`, 이동·확대·축소, 테이블·컬럼 편집
- 순서가 있는 복합 PK와 복합 FK 매핑, 일대일·일대다·자기 참조 관계
- 검색, 숨김/복원, 논리명·물리명·타입·코멘트 표시 옵션
- MySQL DDL 미리보기·복사·다운로드, 설계 오류 안내

**작업 데이터는 현재 화면에서만 유지되며 새로고침하면 초기화됩니다.** 서버 저장, 브라우저 저장, 로그인, 협업, DB import는 포함하지 않습니다. SQL 다운로드는 ERD 프로젝트 저장 파일이 아니며 다시 가져오는 기능은 없습니다.

### MySQL 지원

| 타입                                     | 편집 옵션                                      |
| ---------------------------------------- | ---------------------------------------------- |
| INT, BIGINT                              | UNSIGNED                                       |
| VARCHAR                                  | 길이 1~16383                                   |
| DECIMAL                                  | 정밀도 1~~65, 소수 자릿수 0~~30 및 정밀도 이하 |
| TEXT, BOOLEAN, DATE, DATETIME, TIMESTAMP | 추가 옵션 없음                                 |

새 컬럼은 BIGINT, NULL 허용으로 시작합니다. auto increment, 기본값 편집, 일반 index, 독립 unique key 편집 UI, undo/redo는 이번 MVP에 포함하지 않습니다. TEXT는 키 컬럼으로 사용하지 않습니다.

DDL은 MySQL 8.4, InnoDB 기본 16KB 페이지, utf8mb4를 기준으로 생성합니다. 컬럼/키 크기는 보수적인 상한으로 검사하므로 경계 크기의 설계는 추가 조정이 필요할 수 있습니다. 실제 DB 실행 결과는 대상 서버 설정에 따라 달라질 수 있습니다.

- 모든 테이블을 생성한 후 FK 제약을 추가하므로 순환 참조도 표현할 수 있습니다.
- 일대다는 참조 대상 1 : FK 소유 N입니다. 일대일에는 FK 컬럼 조합의 UNIQUE 제약을 생성합니다. NULL 허용 여부는 별도로 유지되므로 필수 연결을 의미하지 않습니다.
- 숨긴 테이블도 내보냅니다. 논리명은 화면에 사용하고 코멘트는 SQL COMMENT로 내보냅니다.
- 코멘트를 보존하기 위해 생성 스크립트는 `NO_BACKSLASH_ESCAPES`를 일시 적용하고 마지막 문장에서 이전 SQL 모드를 복원합니다. 중간에 실행이 실패하면 마지막 복원 문장을 실행하세요.

타입·FK·문자열 처리 기준: [MySQL 데이터 타입](https://dev.mysql.com/doc/refman/8.4/en/data-types.html), [FK 제약](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html), [문자열 리터럴](https://dev.mysql.com/doc/refman/8.4/en/string-literals.html).

## 검증 및 빌드

```powershell
npm.cmd run check
npm.cmd run e2e
npm.cmd run knip
npm.cmd run build
```

`check`는 포맷·린트·타입 검사·단위/컴포넌트 테스트를 실행합니다. E2E는 Chromium이 필요하며 최초 설치 시 `npx.cmd playwright install chromium`을 실행합니다. E2E 실행기는 로컬 서버를 시작하고 종료하며 변환 캐시를 `node_modules/.cache/playwright`에 둡니다.

주요 기술은 React, TypeScript, Vite, React Flow, Zustand, Zod, Tailwind CSS입니다. 구현은 `app → pages → widgets → features → entities → shared` 방향으로 구성합니다.
