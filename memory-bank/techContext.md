# Tech Context: GPT-IMAGE-1 Playground

## Technologies Used

### Core Framework
- **Next.js 15.3.1**: React framework with App Router
  - Server-side rendering capabilities
  - API routes for backend logic
  - Built-in optimization features
  - Turbopack for fast development builds

- **React 19.0.0**: Latest UI library
  - Hooks-based architecture
  - Client components for interactivity
  - Concurrent features

- **TypeScript 5.x**: Type-safe JavaScript
  - Strong typing throughout codebase
  - Enhanced IDE support
  - Compile-time error checking

### Styling & UI

#### CSS Framework
- **Tailwind CSS 4.1.4**: Utility-first CSS
  - Responsive design utilities
  - Dark mode support
  - Custom configuration in tailwind.config
  - PostCSS integration

#### Component Library
- **Radix UI**: Unstyled, accessible components
  - @radix-ui/react-dialog: Modal dialogs
  - @radix-ui/react-tabs: Tab navigation
  - @radix-ui/react-slider: Range inputs
  - @radix-ui/react-select: Dropdowns
  - @radix-ui/react-checkbox: Checkboxes
  - @radix-ui/react-toggle: Toggle buttons

#### Styling Utilities
- **clsx**: Conditional className composition
- **tailwind-merge**: Merge Tailwind classes safely
- **class-variance-authority**: Component variant management

### Data Storage

#### Browser Storage
- **Dexie.js 4.0.11**: IndexedDB wrapper
  - Async/await API
  - React hooks integration (dexie-react-hooks)
  - Blob storage for images
  - Database versioning

#### Local Storage
- History metadata persistence
- User preferences (delete confirmation, password hash)
- Language selection

### API Integration

#### OpenAI
- **openai 4.96.0**: Official OpenAI SDK
  - Image generation (DALL-E 3)
  - Image editing capabilities
  - Streaming support
  - Error handling

### Internationalization
- **i18next 25.5.0**: i18n framework
- **react-i18next 15.7.3**: React integration
- **i18next-browser-languagedetector 8.2.0**: Auto language detection
- Support for English and Chinese locales

### UI Enhancements
- **lucide-react 0.503.0**: Icon library
  - Consistent icon set
  - Tree-shakeable
  - Customizable size/color

- **next-themes 0.4.6**: Theme management
  - Dark/light mode support
  - System preference detection
  - No flash on load

## Development Setup

### Package Manager
- npm (default)
- Also supports: yarn, pnpm, bun

### Scripts
```json
{
  "dev": "next dev --turbopack",      // Development with Turbopack
  "build": "next build",               // Production build
  "start": "next start",               // Production server
  "lint": "next lint",                 // ESLint checking
  "format": "prettier --write \"src/**/*.{ts,tsx}\""  // Code formatting
}
```

### Development Tools

#### Linting & Formatting
- **ESLint 9**: Code quality
  - Next.js specific rules
  - TypeScript integration
  
- **Prettier 3.5.3**: Code formatting
  - Import sorting (@trivago/prettier-plugin-sort-imports)
  - Tailwind class sorting (prettier-plugin-tailwindcss)
  - Consistent formatting rules

#### Build Tools
- **Turbopack**: Fast bundler for development
- **Webpack**: Production bundler (via Next.js)
- **PostCSS**: CSS processing with Tailwind

### Environment Configuration

#### Required Variables
```env
OPENAI_API_KEY=sk-...                    # Required: OpenAI API key
```

#### Optional Variables
```env
OPENAI_API_BASE_URL=https://...          # Custom API endpoint
APP_PASSWORD=...                          # Password protection
NEXT_PUBLIC_IMAGE_STORAGE_MODE=fs|indexeddb  # Storage mode
```

#### Environment Detection
- `VERCEL`: Detects Vercel deployment
- `NEXT_PUBLIC_VERCEL_ENV`: Environment type (production/preview)

## Technical Constraints

### Browser Requirements
- Modern browser with ES6+ support
- IndexedDB support for serverless mode
- LocalStorage for preferences
- Canvas API for mask drawing
- Clipboard API for paste functionality

### Node.js Requirements
- Version 20.0.0 or higher
- npm/yarn/pnpm/bun package manager

### API Requirements
- OpenAI API key with verified organization
- Sufficient API credits
- Network access to OpenAI endpoints

### Deployment Constraints

#### Local/Docker
- Filesystem write access for images
- Persistent storage for generated-images/
- Port 3000 available (configurable)

#### Vercel/Serverless
- No filesystem persistence
- Must use IndexedDB mode
- Environment variables via Vercel dashboard
- Function size limits

## Dependencies Overview

### Production Dependencies
Total: 25 packages
- Framework: Next.js, React, React-DOM
- UI: Radix UI components (10 packages)
- Styling: Tailwind, clsx, CVA
- Data: Dexie, OpenAI SDK
- i18n: i18next ecosystem (3 packages)
- Icons: Lucide React
- Themes: next-themes

### Development Dependencies
Total: 15 packages
- TypeScript and types (5 packages)
- Linting: ESLint ecosystem
- Formatting: Prettier and plugins
- CSS: Tailwind and PostCSS tools

## Tool Usage Patterns

### API Client Pattern
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL
});

// Generation
const response = await openai.images.generate({
  model: "gpt-image-1",
  prompt: userPrompt,
  n: numberOfImages,
  size: imageSize,
  quality: quality,
  response_format: format
});

// Editing
const editResponse = await openai.images.edit({
  model: "gpt-image-1",
  image: imageFile,
  mask: maskFile,
  prompt: editPrompt,
  n: numberOfImages,
  size: imageSize
});
```

### Database Pattern (Dexie)
```typescript
import Dexie from 'dexie';

class ImageDatabase extends Dexie {
  images!: Table<ImageRecord>;
  
  constructor() {
    super('ImageDatabase');
    this.version(1).stores({
      images: 'filename'
    });
  }
}

// Usage
await db.images.put({ filename, blob });
const record = await db.images.get(filename);
await db.images.delete(filename);
```

### Internationalization Pattern
```typescript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation('common');
  return <div>{t('welcome')}</div>;
}
```

### Component Styling Pattern
```typescript
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    "base-styles",
    isActive && "active-styles",
    variant === "primary" && "primary-styles"
  )}
/>
```

## Configuration Files

### TypeScript (tsconfig.json)
- Target: ES2017
- Module: ESNext
- Strict mode enabled
- Path aliases: @/* → src/*

### Tailwind (tailwind.config.js)
- Custom theme extensions
- Content paths configured
- Plugin integrations

### Prettier (.prettierrc.json)
- Print width: 120
- Tab width: 4
- Single quotes
- Import sorting

### ESLint (eslint.config.mjs)
- Next.js recommended rules
- TypeScript support
- Custom rule configurations

### Docker (Dockerfile)
- Multi-stage build
- Node.js 20-alpine base
- Non-root user execution
- Optimized layer caching

## Performance Considerations

### Bundle Size
- Tree-shaking for icons
- Dynamic imports where applicable
- Minimal runtime dependencies

### Image Optimization
- Lazy loading for history images
- Blob URL management
- Compression options for JPEG/WebP

### Caching Strategy
- Static assets cached by Next.js
- API responses not cached (real-time)
- Browser storage for user data

## Security Considerations

### API Key Management
- Server-side only
- Never exposed to client
- Environment variable storage

### Password Protection
- SHA-256 hashing
- Client-side hash storage
- Server-side validation

### Input Validation
- File type checking
- Size limitations
- Prompt sanitization

### CORS & CSP
- Configured via Next.js
- API route protection
- Content Security Policy headers
