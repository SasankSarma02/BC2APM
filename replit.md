# BC Migration Accelerator

## Overview

This application is a BusinessConnect Migration Accelerator designed to facilitate the migration of artifacts from TIBCO BusinessConnect to Anypoint Partner Manager (APM). It provides a step-by-step workflow for extracting artifacts from BusinessConnect, transforming them into a format compatible with APM, reviewing the transformed data, and deploying the artifacts to APM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The BC Migration Accelerator follows a modern full-stack architecture:

1. **Frontend**: React application with Tailwind CSS and shadcn/ui components for the user interface
2. **Backend**: Express.js server handling API requests
3. **Database**: PostgreSQL database using Drizzle ORM for schema management
4. **Authentication**: Simple username/password authentication

The application is designed to run as a single service, with the Express server also serving the React frontend in production. The server handles database operations, extraction from BusinessConnect, transformation of the data, and loading into APM.

## Key Components

### Frontend

- **React**: The UI framework for building the interface
- **Tailwind CSS**: For styling components with utility classes
- **shadcn/ui**: Component library based on Radix UI for accessible UI elements
- **React Query**: For fetching, caching, and updating server state
- **Wouter**: Lightweight routing library for page navigation

The frontend is organized into pages that represent different steps in the migration workflow:

1. **Dashboard**: Overview of migration progress and status
2. **Extract**: Interface for extracting artifacts from BusinessConnect
3. **Transform**: Screen for transforming extracted artifacts
4. **Review**: Interface for reviewing and approving transformations
5. **Deploy**: Screen for deploying approved artifacts to APM
6. **History**: View of migration history
7. **Configuration**: Settings for connections to BusinessConnect and APM

### Backend

- **Express.js**: Web server framework
- **Drizzle ORM**: Database ORM for PostgreSQL
- **@neondatabase/serverless**: Client for connecting to PostgreSQL
- **BcCliExtractor**: Custom module for extracting artifacts from BusinessConnect CLI
- **XmlToJsonTransformer**: Module for transforming BC XML data to APM-compatible JSON
- **ApmLoader**: Module for loading transformed data into Anypoint Partner Manager

### Database

The application uses a PostgreSQL database with the following main tables:

1. **users**: For authentication
2. **artifacts**: Stores the extracted artifacts along with their transformation status
3. **extractions**: Records of extraction operations
4. **migrations**: History of artifact migrations to APM
5. **configurations**: System configuration settings

## Data Flow

1. **Extraction**: 
   - User provides BusinessConnect credentials or CLI path
   - System extracts artifacts using BcCliExtractor
   - Extracted artifacts are stored in the database with status "new"

2. **Transformation**:
   - System transforms XML data to APM-compatible JSON using XmlToJsonTransformer
   - Transformed artifacts are stored with status "pending"

3. **Review**:
   - User reviews transformed artifacts
   - Upon approval, artifacts are marked for deployment with status "migrated" or rejected with status "error"

4. **Deployment**:
   - System deploys approved artifacts to APM using ApmLoader
   - Migration records are created in the database

## External Dependencies

1. **BusinessConnect**: Source system from which artifacts are extracted
   - Access via CLI or REST API requires credentials
   
2. **Anypoint Partner Manager (APM)**: Target system for migrated artifacts
   - Requires API credentials (clientId/clientSecret)

3. **External Libraries**:
   - **xml2js**: For parsing and converting XML data
   - **adm-zip**: For handling ZIP archives (likely for artifact packaging)
   - **@tanstack/react-query**: For data fetching and state management
   - Various UI component libraries from Radix UI

## Deployment Strategy

The application is configured to be deployed on Replit with the following characteristics:

1. **Development Mode**:
   - Runs with `npm run dev` which uses tsx to execute the server
   - Vite serves the frontend in development mode with hot reloading

2. **Production Mode**:
   - Builds the frontend with Vite
   - Bundles the server with esbuild
   - Runs with Node.js in production mode

3. **Database**:
   - Uses Neon PostgreSQL through the @neondatabase/serverless package
   - Connection through WebSockets for serverless environments

The deployment is configured to scale automatically through Replit's autoscaling feature.

## Getting Started

1. Ensure PostgreSQL module is enabled in your Replit
2. Set the DATABASE_URL environment variable to connect to your PostgreSQL database
3. Run `npm run db:push` to initialize the database schema
4. Run `npm run dev` to start the development server
5. Configure BusinessConnect and APM credentials in the Configuration page

## Common Tasks

### Adding New Artifact Types

1. Update the `artifactTypes` array in `shared/schema.ts`
2. Add a new transformation method in `server/transformers/xmlToJsonTransformer.ts`
3. Add a new loading method in `server/loaders/apmLoader.ts`

### Modifying Database Schema

1. Update the schema definitions in `shared/schema.ts`
2. Run `npm run db:push` to apply the changes to the database

### Adding New API Endpoints

1. Extend the API definitions in `server/routes.ts`
2. Add corresponding frontend API methods in `client/src/lib/api.ts`