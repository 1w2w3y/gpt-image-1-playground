# Product Context: GPT-IMAGE-1 Playground

## Why This Project Exists

### Problem Statement
OpenAI's `gpt-image-1` model provides powerful image generation and editing capabilities, but accessing these features typically requires:
- Direct API integration with code
- Manual parameter configuration
- No visual feedback during experimentation
- Lack of cost visibility
- No built-in history tracking
- Complex mask creation for edits

This creates friction for users who want to:
- Quickly experiment with different prompts and parameters
- Understand the cost implications of their usage
- Maintain a history of their generations
- Create and apply masks visually for targeted edits
- Deploy their own instance with customizable storage options

### Solution
The GPT-IMAGE-1 Playground provides a complete, self-hostable web interface that:
- Eliminates the need for direct API coding
- Provides instant visual feedback
- Tracks all costs transparently
- Maintains comprehensive history
- Offers intuitive mask creation tools
- Adapts to different deployment environments

## How It Should Work

### User Journey

#### First-Time Setup
1. User clones repository or deploys to Vercel
2. Configures OpenAI API key via environment variables
3. Optionally sets password for access control
4. Chooses storage mode based on deployment type

#### Generation Workflow
1. User selects "Generate" mode
2. Enters creative prompt describing desired image
3. Adjusts parameters:
   - Image size and quality
   - Output format and compression
   - Background and moderation settings
   - Number of images to generate
4. Clicks generate and sees real-time loading feedback
5. Views results in grid or individual view
6. Can immediately send any result to edit mode

#### Editing Workflow
1. User selects "Edit" mode
2. Either:
   - Uploads an image file
   - Pastes from clipboard
   - Sends from generation results
   - Selects from history
3. Writes prompt describing desired changes
4. Optionally creates mask by:
   - Drawing directly on image
   - Uploading existing mask
   - Using brush size controls
5. Submits edit request
6. Views modified results

#### History Management
1. All operations automatically saved to history
2. User can:
   - View thumbnail previews
   - See full cost breakdowns
   - Retrieve any previous image
   - Delete individual items
   - Clear entire history
3. History persists across sessions
4. Cost tracking accumulates over time

### User Experience Goals

#### Simplicity
- One-click deployment options
- No coding required for basic use
- Intuitive UI that mirrors creative workflow
- Smart defaults for all parameters

#### Transparency
- Clear cost information before and after operations
- Detailed breakdowns of API usage
- Visible parameter effects
- Error messages that explain issues

#### Flexibility
- Works in multiple environments (local, Docker, Vercel)
- Adapts storage based on deployment
- Supports multiple languages
- Allows full parameter control

#### Efficiency
- Fast image loading and caching
- Batch operations support
- Keyboard shortcuts (paste support)
- Quick mode switching
- Direct edit-from-results flow

### Key Interactions

#### Parameter Controls
- Sliders for numeric values (compression, brush size, image count)
- Dropdowns for discrete options (size, quality, format)
- Toggle buttons for mode switching
- Real-time parameter validation

#### Image Display
- Grid view for multiple images
- Individual view for detailed inspection
- Click to zoom/expand
- Download on click
- Send to edit with single button

#### Mask Creation
- Click and drag to draw
- Adjustable brush size
- Clear and reset options
- Preview before submission
- Visual feedback during drawing

#### History Panel
- Chronological ordering (newest first)
- Thumbnail previews
- Expandable details
- Quick actions (select, delete, send to edit)
- Search/filter capabilities (future enhancement)

### Success Metrics
- Time from landing to first generation < 30 seconds
- Zero failed generations due to UI issues
- Cost tracking accuracy 100%
- History retrieval success rate 100%
- Cross-browser compatibility
- Mobile responsiveness

## Product Philosophy

### Core Principles
1. **Accessibility**: Anyone should be able to use AI image generation without coding
2. **Transparency**: Users should understand what they're paying for
3. **Control**: Full access to all API parameters
4. **Flexibility**: Adapt to different deployment needs
5. **Reliability**: Consistent performance and data persistence

### Design Decisions
- **Dark theme by default**: Reduces eye strain during creative work
- **Two-column layout**: Input on left, output on right mirrors reading flow
- **Immediate feedback**: Loading states, error messages, success confirmations
- **Progressive disclosure**: Advanced options available but not overwhelming
- **Non-destructive**: History preserved, easy recovery of past work

### Future Vision
While maintaining simplicity, the product could evolve to include:
- Prompt templates and suggestions
- Batch processing workflows
- Advanced search and filtering
- Collaborative features
- API usage analytics
- Custom model support
- Plugin architecture
