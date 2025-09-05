# Project Brief: GPT-IMAGE-1 Playground

## Project Overview
A web-based playground application for interacting with OpenAI's `gpt-image-1` model, providing comprehensive image generation and editing capabilities through an intuitive user interface.

## Core Purpose
Create a full-featured web application that allows users to:
- Generate new images from text prompts using OpenAI's API
- Edit existing images with text-based modifications and visual masking
- Track generation history and costs
- Manage images efficiently across different storage modes

## Key Requirements

### Functional Requirements
1. **Image Generation Mode**
   - Text-to-image generation using prompts
   - Full parameter control (size, quality, format, compression, background, moderation)
   - Batch generation support (multiple images per request)

2. **Image Editing Mode**
   - Upload or paste images for editing
   - Text-based image modifications
   - Visual mask creation tool for targeted edits
   - Support for multiple source images (up to 10)

3. **History Management**
   - Complete generation/edit history tracking
   - Cost tracking and breakdown per operation
   - Image preview and retrieval
   - Individual and bulk deletion capabilities
   - Persistent storage across sessions

4. **Storage Flexibility**
   - Filesystem storage mode for local/server deployments
   - IndexedDB storage mode for serverless/Vercel deployments
   - Automatic detection of deployment environment

5. **Security**
   - Optional password protection for API access
   - Client-side password hashing
   - Secure API key management

### Technical Requirements
1. **Performance**
   - Fast image loading and display
   - Efficient memory management with blob URLs
   - Responsive UI across devices

2. **User Experience**
   - Intuitive interface with clear mode switching
   - Real-time feedback during operations
   - Error handling and user notifications
   - Internationalization support (English/Chinese)

3. **Deployment**
   - Docker support for containerized deployment
   - Vercel deployment compatibility
   - Local development environment support

## Success Criteria
- Users can successfully generate and edit images using OpenAI's API
- All API parameters are accessible and functional
- History and cost tracking work reliably
- The application runs smoothly in both local and cloud environments
- Password protection secures API access when enabled

## Constraints
- Must work with OpenAI's `gpt-image-1` model limitations
- Masking feature has known limitations (acknowledged by OpenAI)
- Organization must be verified with OpenAI to use the API
- Node.js version 20+ required

## Target Users
- Developers testing OpenAI's image generation capabilities
- Designers prototyping with AI-generated images
- Teams needing cost tracking for image generation
- Anyone requiring a self-hosted image generation interface
