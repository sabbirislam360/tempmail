# TempVortex ⚡🌪️

**TempVortex** is a professional-grade, privacy-focused disposable email SaaS application. Built with **React 19** and **TypeScript**, it aggregates multiple email providers into a single, stunning interface, allowing users to generate temporary identities, bypass spam, and securely manage OTPs.

The application features a "Glassmorphism" UI, intelligent in-memory processing (zero persistence), and a robust multi-provider architecture.

![React](https://img.shields.io/badge/react-v19.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/typescript-v5.0-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/vite-v6.0-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Key Features

### 🛡️ Core Functionality
* **Multi-Provider Strategy**: Switch instantly between **1secmail**, **Mail.tm**, and **Guerrilla Mail** via a unified `IEmailProvider` interface.
* **Real-Time Sync**: Intelligent polling (8s interval) with audio alerts for incoming messages.
* **Smart OTP Extraction**: Automatically detects, extracts, and highlights 2FA/Verification codes from incoming emails.
* **Custom Aliases**: Claim custom usernames (e.g., `user@domain.com`) on supported providers (Mail.tm & 1secmail).

### 🚀 User Experience
* **Session Recovery**: Generate shareable magic links to access the same inbox across devices or browsers.
* **Secure Attachments**: Preview and download attachments safely without exposing your device.
* **PDF Export**: Convert full email threads into formatted PDF documents using `html2pdf.js`.
* **Keyboard Shortcuts**:
    * `R`: Refresh Inbox
    * `Del`: Delete selected message

### 🎨 UI/UX
* **Glassmorphism Design**: Modern, translucent UI components with Tailwind CSS.
* **Dark/Light Mode**: Fully responsive theming support.
* **Privacy-First**: All data is processed in RAM. No logs, metadata, or tracking cookies are stored.

## 🛠️ Tech Stack

* **Framework**: React 19
* **Language**: TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS (Custom animations, Glass effects)
* **Icons**: Lucide React
* **State Management**: React Hooks (Context-free architecture)
* **Key Libraries**:
    * `sonner`: For toast notifications.
    * `dompurify`: To sanitize incoming HTML emails and prevent XSS.
    * `html2pdf.js`: For email-to-PDF rendering.
