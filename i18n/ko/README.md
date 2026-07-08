<div align="center">

# 🚀 Antigravity CLI 패키지 관리자
**Google Antigravity (agy) 공식 플러그인 관리자.**

[English](../../README.md) · [简体中文](../zh-CN/README.md) · [繁體中文](../zh-TW/README.md) · [日本語](../ja/README.md) · [한국어](README.md)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/npm/v/agy-plugins-cli.svg?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/agy-plugins-cli)
[![CLI](https://img.shields.io/badge/CLI-Command_Line-black?style=for-the-badge&logo=gnometerminal)](https://github.com/ZaunEkko/agy-plugins-cli)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://github.com/ZaunEkko/agy-plugins-cli/blob/main/LICENSE)

> 여러 저장소에 걸쳐 Antigravity 플러그인을 완벽하게 설치, 업데이트 및 관리합니다. 대화형 터미널 UI, 세분화된 네임스페이스 지원 및 안전한 컨텍스트 병합 기능을 제공합니다.

</div>

<br />

## ✨ 주요 기능

- **🌐 다중 마켓플레이스 지원**: 여러 원격 GitHub 저장소(예: `ZaunEkko/agy-plugins`)를 플러그인 소스로 추가하고 전환할 수 있습니다.
- **⚡ 초고속 핫 업데이트**: 원격 저장소에서 최신 `commit` 지문을 가져와 글로벌, 네임스페이스 또는 개별 플러그인 수준에서 즉시 업데이트를 수행합니다.
- **🖥️ 대화형 TUI**: `@clack/prompts`로 구축된 멋진 터미널 사용자 인터페이스를 통해 플러그인을 탐색하고, 업데이트 상태를 확인하고, 일괄 설치할 수 있습니다.
- **🔐 비공개 저장소 제로 구성 액세스**: 로컬 `gh auth token`을 기본적으로 감지하고 활용하여 GitHub API 속도 제한을 우회하고 엔터프라이즈 비공개 플러그인 저장소에 원활하게 액세스합니다.
- **🛡️ 안전한 Hook 및 MCP 병합**: 여러 `hooks.json` 및 `mcp.json` 구성을 글로벌 작업 공간에 자동으로 안전하게 병합합니다. JSON 문자열 중복 제거 기술을 통해 기존 서버를 덮어쓰거나 중복 스크립트를 트리거하지 않습니다.

<br />

## 📦 설치

컴퓨터에 `agy-plugins-cli`를 전역으로 설치하려면 다음 명령을 실행합니다.

```bash
npm install -g agy-plugins-cli@latest
```

*설치 후 터미널 어디에서나 `agy-plugin` 명령을 사용할 수 있습니다!*

<br />

## 🚀 빠른 시작

### 1. 마켓플레이스 추가 및 탐색
GitHub 저장소를 로컬 레지스트리에 바인딩하고 대화형 인터페이스를 통해 플러그인을 탐색합니다.
```bash
# 저장소를 마켓플레이스로 추가
agy-plugin marketplace add ZaunEkko/agy-plugins

# 대화형 마켓플레이스 대시보드 열기
agy-plugin marketplace list
```
*(대화형 터미널 패널에서는 사용 가능한 플러그인을 탐색하고, 업데이트 날짜를 확인하고, 단일 키 입력으로 일괄 설치할 수 있습니다!)*

### 2. 플러그인 설치
플러그인 이름과 저장소 네임스페이스를 지정하여 연결된 마켓플레이스에서 플러그인을 설치합니다.
```bash
agy-plugin add commit-commands@zaunekko
agy-plugin add explanatory-output-style@zaunekko
```
*(CLI는 해당 `skills` 및 `hooks`를 로컬 `.gemini/config/` 디렉토리에 안전하게 다운로드합니다!)*

### 3. 플러그인 최신 상태 유지
원격 작성자로부터 최신 업데이트를 쉽게 가져와 동기화합니다. CLI는 로컬 및 원격 SHA 지문을 추적하여 오래된 플러그인을 동적으로 감지합니다.
```bash
# 글로벌 업데이트: 모든 네임스페이스의 모든 플러그인 업데이트
agy-plugin update

# 네임스페이스 업데이트: 특정 네임스페이스의 모든 플러그인 업데이트
agy-plugin update @zaunekko

# 개별 업데이트: 특정 플러그인 직접 업데이트
agy-plugin update commit-commands@zaunekko
```

<br />

## 🧠 아키텍처 및 보안

- **지문 추적**: `agy-plugin`은 다운로드한 디렉토리의 최신 Git `sha`를 로컬 `~/.gemini/config/state.json`에 캐시합니다. 이를 통해 지능형 델타 업데이트가 가능하며 TUI 패널에서 직관적인 시각적 피드백(설치됨 vs 업데이트 가능)을 제공합니다.
- **동적 컨텍스트 주입**: Antigravity는 `.gemini/config/` 디렉토리에 배치된 모든 콘텐츠를 기본적으로 로드합니다. 이 CLI는 원격 커뮤니티 저장소와 로컬 AI 컨텍스트를 연결하는 안전한 브리지 역할을 합니다.
- **`gh` CLI 통합**: 내부적으로 `GITHUB_TOKEN` 환경 변수를 찾을 수 없는 경우 도구는 `gh auth token` 명령을 통해 토큰을 추출하려고 시도합니다. 이를 통해 로컬 Git 워크플로가 방해받지 않도록 보장합니다.

## 📄 라이선스

이 프로젝트는 [MIT License](https://github.com/ZaunEkko/agy-plugins-cli/blob/main/LICENSE)에 따라 오픈 소스로 제공됩니다.

<br />

<div align="center">
  <i>Antigravity를 위해, Antigravity가 만들었습니다.</i>
</div>
