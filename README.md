# 日中翻译助手 / Japanese-Chinese Translation Assistant

[English Version](#english-version)

## 简介

日中翻译助手是一个基于Web的翻译工具，专门用于日语到中文的翻译。它不仅提供基本的翻译功能，还能对日语句子进行语法分析，帮助用户更好地理解日语的语言结构。

### 主要特性

- 🔄 日语到中文的精确翻译
- 📊 详细的语法分析（包括词性、词形变化等）
- 💾 本地翻译历史记录
- 🔗 支持URL参数传递文本
- 📱 响应式设计，支持移动端
- ⚙️ 可配置的API设置

### 技术栈

- React + TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB)
- React Hook Form
- Axios

## 快速开始

### 安装

```bash
git clone [repository-url]
cd [project-directory]
npm install
```

### 开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### Docker 部署

```bash
# 构建 Docker 镜像
docker build -t jp-translate .

# 运行容器
docker run -p 80:80 jp-translate
```

### GitHub Actions

本项目配置了 GitHub Actions 工作流，可以自动构建 Docker 镜像并推送到 GitHub Container Registry。

工作流程会在以下情况触发：
- 推送到 main 分支
- 创建 Pull Request 到 main 分支
- 手动触发

要使用此功能，请确保：
1. 仓库有权限访问 GitHub Packages
2. 工作流程有适当的权限

### 配置

在使用之前，需要配置：
1. API URL
2. API Key

## 使用说明

1. 在左侧文本框输入需要翻译的日语文本
2. 点击"翻译"按钮
3. 右侧将显示翻译结果和详细的语法分析
4. 翻译历史会自动保存在本地

---

# English Version

## Introduction

Japanese-Chinese Translation Assistant is a web-based translation tool specifically designed for Japanese to Chinese translation. It not only provides basic translation functionality but also performs grammatical analysis of Japanese sentences to help users better understand Japanese language structures.

### Key Features

- 🔄 Accurate Japanese to Chinese translation
- 📊 Detailed grammatical analysis (including parts of speech, word inflections, etc.)
- 💾 Local translation history
- 🔗 URL parameter support for text input
- 📱 Responsive design for mobile devices
- ⚙️ Configurable API settings

### Tech Stack

- React + TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB)
- React Hook Form
- Axios

## Getting Started

### Installation

```bash
git clone [repository-url]
cd [project-directory]
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Docker Deployment

```bash
# Build Docker image
docker build -t jp-translate .

# Run container
docker run -p 80:80 jp-translate
```

### GitHub Actions

This project is configured with a GitHub Actions workflow that automatically builds a Docker image and pushes it to the GitHub Container Registry.

The workflow is triggered when:
- Pushing to the main branch
- Creating a Pull Request to the main branch
- Manual trigger

To use this feature, ensure:
1. The repository has access to GitHub Packages
2. The workflow has appropriate permissions

### Configuration

Before using, you need to configure:
1. API URL
2. API Key

## Usage

1. Enter Japanese text in the left text box
2. Click the "Translate" button
3. Translation results and detailed grammatical analysis will be displayed on the right
4. Translation history is automatically saved locally
```
