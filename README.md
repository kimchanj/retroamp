# ✨ RetroAmp

![Electron](https://img.shields.io/badge/Electron-26+-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)
![Version](https://img.shields.io/github/v/tag/kimchanj/retroamp)
![License](https://img.shields.io/badge/license-MIT-green)

<p align="left">
  <img src="docs/images/demo.gif" width="520" />
</p>

▶ Demo: Open file → Play → Seek → Volume control <p/>
   Winamp-inspired retro MP3 player built with **Electron + Vite + React + TypeScript**.

---

## ✨ Features

- 🎵 MP3 playback (HTML5 Audio)
- 🎚 Volume / Position slider control
- ⏱ Current time / total duration display
- 📂 File open dialog (load local MP3)
- 🖥 Desktop app (Electron)

---

## 🧱 Tech Stack

- Electron (Desktop shell)
- Vite (Build / Dev server)
- React + TypeScript (UI)
- CSS (Winamp-inspired retro styling)

---

## 🚀 Run (dev)

```bash
npm install
npm run dev
```
---

## 📦 Build
```bash
npm run build
```
---

## 🛣 Roadmap
 - Winamp-like window sizing / fixed aspect ratio
 - Playlist window (PL) + multi-track queue
 - Skinnable UI (winamp-style skin assets)
 - Equalizer UI (visual only → optional audio processing later)
 - Keyboard shortcuts
---

## 📜 License
- MIT
---

## 📦 Program Intro
### 제목
**RetroAmp — Electron 기반 Winamp 감성 MP3 플레이어 (React/TS)**

### 한줄 요약
웹(React) 경험을 기반으로 Electron 데스크탑 앱 개발로 확장한 개인 프로젝트. 로컬 MP3 파일 재생과 기본 컨트롤(UI/상태관리)을 구현.

### 프로젝트 배경/문제
- 웹만 하다가 데스크탑 앱을 만들 때 **프로세스 분리(Electron main/renderer), 빌드/패키징, 로컬 파일 접근** 같은 영역이 낯설었음
- 단순하지만 “앱다운 앱”을 만들며 Electron 구조를 학습하고 싶었음

### 내가 한 일 (핵심)
- Electron + Vite + React + TypeScript 기반 개발 환경 구성
- MP3 파일 선택 → 로드 → 재생/정지/시킹/볼륨 제어 구현
- 재생 시간/전체 시간 표시, 상태 전환에 따른 UI 반영
- Winamp 감성의 레트로 UI 스타일링(레이아웃/버튼/슬라이더)

### 사용 기술
- Electron / Vite / React / TypeScript / CSS

### 결과/성과
- 로컬 MP3 재생이 가능한 데스크탑 앱 프로토타입 완성
- GitHub로 버전 관리, 브랜치 전략(`main` 안정 / `feature/winamp-skin` 실험) 적용
- 다음 단계(스킨/플레이리스트 분리 창) 확장 가능한 구조 확보

### 링크
- GitHub: https://github.com/kimchanj/retroamp
