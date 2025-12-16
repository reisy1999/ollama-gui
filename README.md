# README🚀

## purpose
フロントエンド初学者の私が、アジャイル開発で少しずつチャットアプリを育てて、
私だけのローカルチャットアプリを作成することを目的としています。

## Overview

ローカルで動作する **Ollama API** を、**Next.js の API Route 経由**で利用する Web UI です。

* Framework: **Next.js (App Router)**
* Language: **TypeScript**
* LLM Backend: **Ollama (local)**

## Requirements

* Node.js >= 18
* Ollama(ローカルにインストール)

## Setup

### 1. Ollama を起動

```bash
ollama serve
ollama pull llama3
```

### 2. プロジェクト起動

```bash
git clone <REPOSITORY_URL>
cd <PROJECT_DIR>
npm install
npm run dev
```

ブラウザ:

* [http://localhost:3000](http://localhost:3000)

## Environment Variables

`.env.local` を作成してください。

```env
# Ollama API
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=__YOUR_MODEL_NAME__
```

## Architecture

```
Browser
  │
  │ POST /api/chat
  ▼
Next.js API Route
  │
  │ POST http://localhost:11434/api/chat
  ▼
Ollama (local)
```
