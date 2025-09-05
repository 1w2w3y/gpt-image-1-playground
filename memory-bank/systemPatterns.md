# System Patterns: GPT-IMAGE-1 Playground

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  React Components (Client-side)                  │    │
│  │  - GenerationForm / EditingForm                  │    │
│  │  - ImageOutput / HistoryPanel                    │    │
│  │  - UI Components (Radix UI + Tailwind)          │    │
│  └─────────────────────────────────────────────────┘    │
│                           ↕                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Client Storage                                  │    │
│  │  - LocalStorage (history metadata)               │    │
│  │  - IndexedDB (image blobs - serverless mode)     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                 Next.js Server (API Routes)              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  API Endpoints                                   │    │
│  │  - /api/images (generation/editing)              │    │
│  │  - /api/image/[filename] (retrieval)             │    │
│  │  - /api/image-delete (deletion)                  │    │
│  │  - /api/auth-status (auth check)                 │    │
│  └─────────────────────────────────────────────────┘    │
│                           ↕                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Server Storage (filesystem mode)                │    │
│  │  - ./generated-images directory                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    OpenAI API                            │
│  - Image Generation (dall-e-3)                           │
│  - Image Editing                                         │
└─────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### Storage Strategy Pattern
```typescript
// Dual-mode storage with automatic detection
const storageMode = explicitMode || (isVercel ? 'indexeddb' : 'fs')

// Filesystem Mode (Local/Docker)
if (mode === 'fs') {
  // Server saves to ./generated-images/
  // Client fetches via /api/image/[filename]
}

// IndexedDB Mode (Serverless/Vercel)
if (mode === 'indexeddb') {
  // Server returns base64 in response
  // Client stores blob in IndexedDB via Dexie
  // Images served from blob URLs
}
```

### Component Relationships

#### Main Page Component Structure
```
HomePage (page.tsx)
├── PasswordDialog
├── GenerationForm / EditingForm (mode-based)
│   ├── Form Controls
│   ├── Parameter Inputs
│   └── Submit Handler
├── ImageOutput
│   ├── Grid View
│   ├── Individual View
│   └── Action Buttons
└── HistoryPanel
    ├── History Items
    ├── Cost Display
    └── Delete Controls
```

#### Data Flow Pattern
1. **User Input** → Form Component
2. **Form Submission** → API Call with FormData
3. **API Processing** → OpenAI Request
4. **Response Handling** → Storage (FS/IndexedDB)
5. **UI Update** → Image Display + History Update
6. **History Persistence** → LocalStorage + Optional IndexedDB

### API Design Patterns

#### Request/Response Pattern
```typescript
// Client Request Structure
const formData = new FormData()
formData.append('mode', 'generate' | 'edit')
formData.append('prompt', string)
formData.append('passwordHash', sha256Hash) // if required
// ... additional parameters

// Server Response Structure
{
  images: [{
    filename: string,
    b64_json?: string,  // IndexedDB mode
    path?: string,      // Filesystem mode
    output_format: string
  }],
  usage: {
    // OpenAI usage data for cost calculation
  }
}
```

#### Error Handling Pattern
```typescript
// Consistent error structure
try {
  // API operation
} catch (error) {
  return NextResponse.json(
    { error: error.message },
    { status: appropriate_code }
  )
}
```

### State Management Patterns

#### Form State Management
```typescript
// Controlled components with local state
const [prompt, setPrompt] = useState('')
const [size, setSize] = useState<Size>('auto')
const [quality, setQuality] = useState<Quality>('auto')

// Grouped state for related functionality
const [editImageFiles, setEditImageFiles] = useState<File[]>([])
const [editSourceImagePreviewUrls, setEditSourceImagePreviewUrls] = useState<string[]>([])
```

#### History State Pattern
```typescript
interface HistoryMetadata {
  timestamp: number           // Unique identifier
  images: HistoryImage[]      // Generated images
  storageModeUsed: StorageMode // Track how stored
  durationMs: number          // Performance metric
  costDetails: CostDetails    // Financial tracking
  // ... other metadata
}

// Persistence layer
useEffect(() => {
  localStorage.setItem('openaiImageHistory', JSON.stringify(history))
}, [history])
```

### Critical Implementation Paths

#### Image Generation Flow
```
1. GenerationForm.onSubmit()
2. HomePage.handleApiCall()
3. POST /api/images
4. OpenAI.images.generate()
5. Save to storage (FS/IndexedDB)
6. Return image references
7. Update UI with results
8. Save to history
```

#### Image Editing Flow
```
1. Upload/Paste/Send image to EditingForm
2. Optional: Draw mask on canvas
3. EditingForm.onSubmit()
4. HomePage.handleApiCall()
5. POST /api/images with image + mask
6. OpenAI.images.edit()
7. Process and store results
8. Update UI and history
```

#### Cost Calculation Flow
```
1. Receive OpenAI usage data
2. calculateApiCost() in cost-utils.ts
3. Map model/resolution to pricing
4. Calculate total cost
5. Store in history metadata
6. Display in UI with breakdown
```

### Security Patterns

#### Password Protection
```typescript
// Client-side
const hash = await sha256(password)
localStorage.setItem('clientPasswordHash', hash)

// Server-side
const providedHash = formData.get('passwordHash')
const expectedHash = await sha256(process.env.APP_PASSWORD)
if (providedHash !== expectedHash) {
  return unauthorized()
}
```

#### API Key Protection
- Never exposed to client
- Server-side environment variable only
- Validated on application startup

### Performance Patterns

#### Blob URL Management
```typescript
// Create blob URLs for display
const url = URL.createObjectURL(blob)
setBlobUrlCache(prev => ({...prev, [filename]: url}))

// Cleanup on unmount
useEffect(() => {
  return () => {
    Object.values(blobUrlCache).forEach(url => {
      URL.revokeObjectURL(url)
    })
  }
}, [blobUrlCache])
```

#### Lazy Loading
```typescript
// History images loaded only when selected
const handleHistorySelect = (item: HistoryMetadata) => {
  // Fetch images only when needed
  const images = await loadImagesForItem(item)
  setLatestImageBatch(images)
}
```

### UI/UX Patterns

#### Loading States
```typescript
// Consistent loading pattern
const [isLoading, setIsLoading] = useState(false)

// Wrap async operations
setIsLoading(true)
try {
  await operation()
} finally {
  setIsLoading(false)
}
```

#### Error Display
```typescript
// Centralized error display
{error && (
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

#### Form Validation
```typescript
// Real-time validation
const isValid = prompt.trim() && 
                (mode === 'generate' || imageFiles.length > 0)
                
<Button disabled={!isValid || isLoading}>
  Generate
</Button>
```

## Design Patterns in Use

### Factory Pattern
- Storage mode selection (FS vs IndexedDB)
- Image source URL generation

### Observer Pattern
- React state updates triggering re-renders
- History updates triggering localStorage sync

### Strategy Pattern
- Different storage strategies based on deployment
- Cost calculation based on model/parameters

### Singleton Pattern
- Database connection (Dexie instance)
- OpenAI client instance

### Command Pattern
- Form submission handlers
- History action handlers

## Component Relationships

### Dependency Graph
```
page.tsx
├── depends on → all components
├── manages → global state
└── coordinates → data flow

GenerationForm/EditingForm
├── depends on → UI components
├── emits → form data
└── receives → props from parent

ImageOutput
├── depends on → image data
├── emits → send-to-edit events
└── manages → view state

HistoryPanel
├── depends on → history data
├── emits → selection/deletion events
└── manages → display preferences
```

## Critical Implementation Notes

### Must-Maintain Patterns
1. **Storage mode detection** - Critical for deployment flexibility
2. **Blob URL lifecycle** - Prevents memory leaks
3. **History persistence** - User expectation of data retention
4. **Cost tracking accuracy** - Trust and transparency
5. **Error boundaries** - Graceful degradation

### Extension Points
1. **New storage modes** - Add to storage strategy
2. **Additional parameters** - Extend form components
3. **New API endpoints** - Follow existing patterns
4. **Language support** - Add to i18n structure
5. **UI themes** - Extend theme provider
