# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MIND BREEZE AI Report is a React-based Progressive Web App for AI-powered health analysis using EEG (Electroencephalography) and PPG (Photoplethysmography) biomarkers. It's built with TypeScript, Vite, and follows Domain-Driven Design principles.

## Essential Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000
npm run build           # TypeScript + Vite production build
npm run preview         # Preview production build

# Code Quality
npm run lint            # ESLint for TypeScript/React
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run all tests with Vitest
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
npm run test:ui         # Run tests with UI
```

## Architecture Overview

The codebase follows Domain-Driven Design (DDD) with clear separation of concerns:

### Core Domain Structure
- **`src/domains/`**: Business logic organized by domain
  - `ai-report/`: AI health report generation with specialized analyzers for different biomarkers
  - `ai-chatbot/`: AI chatbot features
  - `individual/`: B2C features for individual users
  - `organization/`: B2B features for organizations (device management, user management)
  - `system/`: System administration features

### Key Architectural Patterns
1. **Service Layer Pattern**: Business logic in service classes (e.g., `AiHealthReportService`, `SystemAdminService`)
2. **Interface-Based Design**: AI engines and renderers use interfaces for flexibility
3. **Registry Pattern**: Dynamic registration of AI engines and renderers
4. **Signal Processing Pipeline**: EEG/PPG processors follow a pipeline pattern for data transformation

### Important Path Aliases
- `@/` → `src/`
- `@core/` → `src/core/`
- `@domains/` → `src/domains/`
- `@shared/` → `src/shared/`
- `@ui/` → `src/shared/components/ui/`

## Key Technical Decisions

### State Management
- **Zustand** stores in `src/stores/` for global state
- Component-level state with React hooks
- Session data persisted to localStorage

### UI Component Strategy
- **Base Components**: shadcn/ui components in `src/shared/components/ui/`
- **Styling**: Tailwind CSS with custom theme configuration
- **Charts**: Recharts for simple charts, ECharts for complex visualizations

### Data Flow Architecture
1. **Device Connection**: Bluetooth devices → DeviceConnectionService → Signal Processors
2. **AI Analysis**: Processed data → AI Analyzers → AI Engines (Gemini) → Report Generation
3. **Organization Flow**: Firebase Auth → Organization Service → Device/User Management

### Firebase Integration
- **Authentication**: Firebase Auth for user management
- **Database**: Firestore for organization and device data
- **Structure**: Organizations have devices and users as subcollections

## Working with AI Report System

The AI report system (`src/domains/ai-report/`) is the core feature:
- **Analyzers**: Specialized analyzers for each biomarker type (EEG, PPG, Overall Health)
- **AI Engines**: Interface-based AI integration (currently Google Gemini)
- **Renderers**: Convert AI responses to structured reports
- **Report Types**: Overall health, mental health risk, medical risk, recommendations

## Testing Approach

- **Framework**: Vitest (Vite-native test runner)
- **Unit Tests**: Service and utility function tests in `__tests__/`
- **Integration Tests**: Cross-service tests in `__tests__/integration/`
- **Mocking**: Vi.mock for external dependencies, especially Firebase

## Current Development Focus

Based on recent commits, the team is working on:
- Device inventory and management system for organizations
- Device assignment/unassignment workflows
- Device deletion with proper cascading
- UI improvements for device management panels

## Environment Variables

Required for AI functionality:
```bash
VITE_GOOGLE_AI_API_KEY=your_api_key_here  # Google Gemini API for report generation
```

## Important Considerations

1. **PWA Features**: The app includes service workers and offline capabilities
2. **Real-time Processing**: EEG/PPG data is processed in real-time using Web Workers
3. **Privacy**: Biomarker data processing happens locally; only AI prompts are sent to external services
4. **Multi-tenant**: Clear separation between B2B (organization) and B2C (individual) features
5. **Device Management**: Complex workflows for Bluetooth device pairing, assignment, and management