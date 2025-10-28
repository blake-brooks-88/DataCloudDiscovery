# Schema Builder - Data Discovery Tool

## Overview

Schema Builder is a web-based data discovery and documentation tool designed for Salesforce Data Cloud consultants. The application helps consultants map client data sources, define entity relationships, and generate deliverables by providing a single source of truth where updates propagate across ERD diagrams, data dictionaries, and documentation.

The tool replaces the need to juggle separate tools (Lucidchart for ERDs, Excel for data dictionaries, Word for blueprints) with a unified interface that maintains consistency across all views and exports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Core Technologies:**

- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- React Context API with custom hooks for local state management

**UI Component System:**

- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with a custom design system
- Design follows a "system-based approach" prioritizing efficiency and data clarity over visual flair
- Custom color palette with strict usage rules (Primary Orange for CTAs, Secondary Blue for navigation, utility colors for status indicators)
- Typography system using Inter for UI text and JetBrains Mono for technical/code content
- Spacing based on a 4px base unit system

**State Management Pattern:**

- Repository pattern for data persistence using localStorage
- Designed to support future backend swap without major refactoring
- All project data, entities, and source systems stored in browser localStorage
- State synchronized across multiple views (Graph View and Table View)

**Key UI Features:**

- Dual-view system: Graph View (visual ERD) and Table/List View (detailed, scannable)
- Interactive entity relationship diagram with zoom, pan, and drag capabilities
- Real-time search and filtering across entities, fields, and source systems
- Modal-based editing for entities, fields, and metadata
- Export capabilities for JSON, ERD diagrams, and data dictionaries

### Backend Architecture

**Server Setup:**

- Express.js server with TypeScript
- Development mode uses Vite middleware for HMR and asset serving
- Production mode serves static built assets
- Modular route registration system (currently minimal implementation)

**Data Storage Interface:**

- Abstract `IStorage` interface for CRUD operations
- Initial implementation uses in-memory storage (`MemStorage`)
- Designed to be swapped with database-backed storage (Drizzle ORM configuration present)
- Session management prepared with `connect-pg-simple` for PostgreSQL sessions

**Database Configuration:**

- Drizzle ORM configured for PostgreSQL dialect
- Schema definitions in `shared/schema.ts` using Zod for validation
- Database credentials expected via `DATABASE_URL` environment variable
- Migration support configured in `drizzle.config.ts`

### Data Models & Schema

**Core Entities:**

- **Project**: Top-level container for client implementation work (name, client info, consultant, timestamps)
- **SourceSystem**: Represents data sources (Salesforce, database, API, CSV, ERP, marketing tools, custom)
- **Entity**: Represents tables/objects with fields, business purpose, Data Cloud object type mapping
- **Field**: Individual data fields with type, constraints (PK/FK), PII flags, business names, sample values

**Relationship Modeling:**

- Foreign key references with cardinality (one-to-one, one-to-many, many-to-one)
- Relationship labels for ERD visualization
- Support for complex multi-source data relationships

**Field Types:**

- Comprehensive type system: string, text, int, float, number, decimal, boolean, date, datetime, timestamp, json, jsonb, uuid, enum, phone, email

**Data Cloud Integration:**

- Object type classification: Profile, Engagement, Other, TBD
- Implementation status tracking: not-started, in-progress, completed

### External Dependencies

**UI Component Libraries:**

- Radix UI primitives for accessible, unstyled components (accordion, dialog, dropdown, popover, select, tabs, toast, tooltip, etc.)
- Lucide React for iconography
- class-variance-authority and clsx for conditional styling utilities

**Data Processing:**

- PapaParse for CSV file parsing and import
- jsPDF or html2pdf.js for PDF generation (exports)
- Mermaid for ERD rendering (mentioned in spec, not yet in package.json)

**Development & Build Tools:**

- TypeScript for type safety across frontend and backend
- ESBuild for server-side bundling
- PostCSS with Tailwind CSS and Autoprefixer
- tsx for running TypeScript in development

**Database & ORM:**

- Drizzle ORM for database interactions
- @neondatabase/serverless for PostgreSQL connections
- Drizzle Zod for schema validation integration

**Form Management:**

- React Hook Form for form state management
- @hookform/resolvers with Zod for validation

**Utilities:**

- date-fns for date manipulation
- nanoid for generating unique IDs
- uuid for RFC-compliant unique identifiers

**Future Integrations:**

- Backend database (PostgreSQL via Neon or similar)
- CSV import/export functionality
- JSON import/export for project backup/restore
- PDF generation for data dictionaries and ERD documentation
- Potential Mermaid integration for enhanced ERD rendering
