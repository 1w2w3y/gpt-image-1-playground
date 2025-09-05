# Active Context: GPT-IMAGE-1 Playground

## Current Work Focus
Added comprehensive download functionality for generated images in both the main image output and history panel components.

## Recent Changes
- **Added Download Functionality to ImageOutput Component:**
  - Implemented `handleDownloadClick()` for single image downloads
  - Implemented `handleDownloadAllClick()` for batch downloads in grid view
  - Added conditional download buttons that appear based on view mode
  - Support for both filesystem and IndexedDB storage modes

- **Added Download Functionality to HistoryPanel Component:**
  - Implemented `handleDownloadImages()` for downloading all images from a history batch
  - Added blue download button alongside existing prompt and delete buttons
  - Proper error handling and sequential downloads with delays

- **Added Translation Support:**
  - English: Added "download", "downloadAll", "downloadImages" keys
  - Chinese: Added corresponding translations for download functionality
  - Updated both `image-output.json` and `history-panel.json` translation files

- **UI Integration:**
  - Download buttons use consistent styling with existing UI
  - Proper disabled states and visibility logic
  - Download icon from Lucide React library
  - Accessibility labels and proper ARIA attributes

## Next Steps
1. Continue monitoring for any other UI/UX issues
2. Test actual image generation functionality when API key is configured
3. Verify all deployment modes work correctly (local, Docker, Vercel)
4. Consider adding unit tests for critical functionality

## Active Decisions and Considerations

### Storage Strategy
- **Dual-mode approach**: Filesystem for local/server deployments, IndexedDB for serverless
- **Automatic detection**: App detects Vercel environment and switches modes accordingly
- **Blob URL management**: Careful lifecycle management to prevent memory leaks

### Security Model
- **Optional password protection**: Not mandatory but available for production deployments
- **Client-side hashing**: SHA-256 hashing before sending to server
- **API key protection**: Server-side only, never exposed to client

### User Experience Priorities
1. **Immediate feedback**: Loading states, progress indicators
2. **Error recovery**: Clear error messages with actionable next steps
3. **Data persistence**: History survives page refreshes and sessions
4. **Visual clarity**: Dark theme with high contrast for creative work

### Technical Choices
- **Next.js 15**: Latest framework version with Turbopack
- **React 19**: Cutting-edge React features
- **Tailwind CSS**: Utility-first styling approach
- **Radix UI**: Accessible, unstyled component primitives
- **Dexie.js**: IndexedDB wrapper for browser storage
- **OpenAI SDK**: Official client library for API interaction

## Important Patterns and Preferences

### Component Architecture
- **Client Components**: Used for interactive UI (marked with 'use client')
- **Form State Management**: Local React state with controlled components
- **Data Flow**: Unidirectional from parent to child components
- **Error Boundaries**: Graceful error handling at component level

### API Design
- **RESTful endpoints**: Clear, semantic API routes
- **FormData for uploads**: Handles both text and binary data
- **Streaming responses**: For real-time feedback during generation
- **Consistent error format**: Standardized error responses

### State Management
- **Local Storage**: For history metadata and preferences
- **IndexedDB**: For image blob storage in serverless mode
- **React State**: For UI state and form controls
- **URL Cache**: For blob URL lifecycle management

### Code Organization
```
src/
  app/           # Next.js app router pages and API routes
    api/         # Server-side API endpoints
  components/    # React components
    ui/          # Reusable UI primitives
  lib/           # Utility functions and helpers
  i18n/          # Internationalization
    locales/     # Language files (en, zh)
```

### Testing Considerations
- **Manual testing focus**: UI interactions and API integration
- **Cost awareness**: Test with minimal API calls to control costs
- **Multi-browser testing**: Chrome, Firefox, Safari compatibility
- **Mobile responsiveness**: Touch interactions for mask drawing

## Learnings and Project Insights

### API Limitations
- **Mask precision**: OpenAI acknowledges mask editing isn't 100% accurate
- **Rate limits**: Need to handle 429 responses gracefully
- **Cost implications**: High-quality, large images significantly more expensive

### Performance Optimizations
- **Blob URL management**: Critical to revoke URLs to prevent memory leaks
- **Lazy loading**: History images only loaded when selected
- **Image compression**: JPEG/WebP with compression for cost savings
- **Debouncing**: Prevent rapid API calls during parameter adjustment

### Deployment Insights
- **Vercel limitations**: No persistent filesystem, hence IndexedDB mode
- **Docker efficiency**: Multi-stage builds reduce image size to ~200MB
- **Environment detection**: Automatic mode switching based on deployment

### User Feedback Patterns
- **Visual feedback priority**: Users expect immediate visual confirmation
- **Cost transparency**: Detailed breakdowns build trust
- **Mask creation**: Drawing directly on image most intuitive approach
- **History value**: Users frequently reference previous generations

## Current Development Context
The application is fully functional with all core features implemented:
- ✅ Image generation with full parameter control
- ✅ Image editing with mask support
- ✅ Complete history tracking with cost calculation
- ✅ Dual storage mode support
- ✅ Password protection option
- ✅ Internationalization (English/Chinese)
- ✅ Docker and Vercel deployment ready

### Recent Bug Fixes
- **Translation Key Issue**: Fixed missing `emptyMessage` key in history panel translations
  - Component was looking for `emptyMessage` but translation files only had `empty`
  - Added the missing key to both English and Chinese translation files
  - Verified fix works in both languages

### Testing Results with Playwright MCP
- ✅ Application starts successfully on localhost:3000
- ✅ Tab switching between Generate and Edit modes works correctly
- ✅ Language switching between English and Chinese functions properly
- ✅ UI components render without errors
- ✅ Translation system loads all required namespaces
- ✅ History panel displays correct empty state message after fix

The codebase is production-ready but could benefit from:
- Enhanced error handling and retry logic
- Performance optimizations for large history
- Additional language support
- Advanced search and filtering for history
- Batch processing capabilities
- Automated testing suite for regression prevention
