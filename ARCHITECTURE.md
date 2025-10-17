# RewindCoach Architecture

## Data Flow Architecture

This document explains how data flows through the application and the reasoning behind the current architecture.

## Current Architecture (After Refactoring)

### Overview

```
┌─────────────────────────────────────────────────────┐
│  Server Components (Pages)                          │
│  ├── Profile Page                                   │
│  ├── Chronicle Page                                 │
│  └── Review Page                                    │
│                                                      │
│  → Call riot.ts functions directly                  │
│  → No HTTP overhead                                 │
│  → Better performance                               │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  lib/riot.ts (Data Layer)                           │
│  ├── getProfileBundle()                             │
│  ├── getMatchBundle()                               │
│  ├── getAccountInfo()                               │
│  ├── getRankedInfo()                                │
│  └── Data transformation utilities                  │
│                                                      │
│  → Makes fetch() calls to Lambda backend            │
│  → Handles data transformation                      │
│  → Type-safe interfaces                             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Lambda Backend API (AWS)                           │
│  └── Riot Games API Proxy                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Client Components                                  │
│  ├── SearchCard.tsx (profile validation)           │
│  ├── MatchList.tsx (load more matches)             │
│  └── CoachChat.tsx (chat streaming)                │
│                                                      │
│  → Make fetch() calls to Next.js API routes         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Next.js API Routes (app/api/*)                     │
│  ├── /api/profile (for SearchCard validation)      │
│  ├── /api/match (for MatchList load more)          │
│  ├── /api/matches (for MatchList pagination)       │
│  └── /api/chat (for streaming responses)           │
│                                                      │
│  → Thin wrappers around riot.ts functions           │
│  → Only exist for client-side needs                 │
└─────────────────────────────────────────────────────┘
```

## File Structure

### Server Components (Direct riot.ts calls)

- **`src/app/profile/[region]/[gameName]/[tagLine]/page.tsx`**
  - Calls `getProfileBundle()` directly
  - No HTTP round-trip needed
  - Faster page loads

- **`src/app/profile/[region]/[gameName]/[tagLine]/chronicle/page.tsx`**
  - Calls `getProfileBundle()` directly
  - Same optimization as profile page

- **`src/app/review/[matchId]/page.tsx`**
  - Calls `getMatchBundle()` directly
  - Immediate data access in server component

### API Routes (For Client Components Only)

- **`src/app/api/profile/route.ts`**
  - **Used by:** `SearchCard.tsx` for client-side profile validation
  - **Why:** Validates profile exists before navigation
  - Calls `getProfileBundle()` from riot.ts

- **`src/app/api/match/route.ts`**
  - **Used by:** `MatchList.tsx` for loading individual matches
  - **Why:** Client-side "load more" functionality
  - Calls `getMatchBundle()` from riot.ts

- **`src/app/api/matches/route.ts`**
  - **Used by:** `MatchList.tsx` for paginated match IDs
  - **Why:** Client-side "load more" with pagination
  - Makes direct backend fetch (could be refactored to use riot.ts)

- **`src/app/api/chat/route.ts`**
  - **Used by:** Chat components for AI responses
  - **Why:** Streaming responses, client-side interactions
  - Directly calls chat API

- **`src/app/api/account-info/route.ts`**
  - **Used by:** Reserved for future client-side usage
  - Calls `getAccountInfo()` from riot.ts

## Key Benefits of This Architecture

### 1. **Performance**
- Server components avoid unnecessary HTTP serialization/deserialization
- Reduced latency for initial page loads
- Direct function calls are faster than HTTP requests

### 2. **Simplicity**
- 2-layer architecture for server rendering (Component → riot.ts → Backend)
- 3-layer only when needed for client-side (Component → API route → riot.ts → Backend)
- Clear separation of concerns

### 3. **Maintainability**
- All data fetching logic centralized in `riot.ts`
- API routes are thin wrappers (no business logic)
- Easy to understand data flow

### 4. **Type Safety**
- Direct TypeScript imports ensure type safety
- No need for runtime type checking in API routes
- IDE autocomplete and refactoring support

### 5. **Caching**
- Can use Next.js fetch cache options directly
- Server components can leverage React cache
- API routes maintain separate cache control for client requests

## When to Use Each Approach

### Use Direct riot.ts Calls When:
- ✅ In Server Components
- ✅ In Server Actions
- ✅ During SSR/ISR
- ✅ In API routes (as a thin wrapper)

### Use API Routes When:
- ✅ Client components need to fetch data
- ✅ Need streaming responses (like chat)
- ✅ External webhooks call your app
- ✅ Need to hide environment variables from edge runtime

## Data Layer (lib/riot/)

The Riot API integration is now organized as a modular package:

```
lib/riot/
  ├── types.ts        - All TypeScript interfaces and type definitions
  ├── fetchers.ts     - Backend API calls and static data loading
  ├── transformers.ts - Data transformation and mapping logic
  └── index.ts        - Main public API exports
```

### Main Functions (lib/riot/index.ts)

- **`getProfileBundle(region, gameName, tagLine)`**
  - Fetches complete profile with matches, Style DNA, and highlights
  - Used by profile and chronicle pages
  - Used by `/api/profile` for client-side validation

- **`getMatchBundle(matchId, focusPuuid?)`**
  - Fetches single match with timeline data
  - Used by review page
  - Used by `/api/match` for load more functionality

- **`getAccountInfo(params)`**
  - Fetches basic account information
  - Used internally by `getProfileBundle()`
  - Available via `/api/account-info` for client usage

- **`getRankedInfo(puuid, platform)`**
  - Fetches ranked statistics
  - Used internally by `getProfileBundle()`

### Module Organization

**types.ts** - Type definitions and constants
- All TypeScript interfaces (RiotMatch, ProfileBundle, etc.)
- Region configurations and mappings
- Backend response types (DTOs)
- Constants (CDN_BASE, QUEUE_NAMES, etc.)

**fetchers.ts** - Data fetching
- `backendFetch()` - Core backend API wrapper
- `riotStaticFetch()` - Static data from Riot CDN
- `getLatestVersion()` - League patch version
- `getRuneMaps()`, `getSummonerSpellMap()`, `getItemMap()` - Game data
- Account fetchers: `getAccountInfo()`, `getRankedInfo()`, `fetchAccount()`
- Match fetchers: `fetchMatches()`, `fetchMatch()`

**transformers.ts** - Data transformation
- `mapParticipantData()` - Converts match DTOs to app types
- `mapTimeline()` - Transforms timeline events
- `summarizeMatches()` - Generates Style DNA and highlights

**index.ts** - Public API
- Re-exports all types
- Exports main functions: `getProfileBundle()`, `getMatchBundle()`
- Exports utility functions that may be needed externally

## Environment Variables

```env
# Backend API Configuration
BACKEND_API_BASE_URL=https://your-lambda-api.amazonaws.com
BACKEND_API_KEY=your-api-key

# Chat API Configuration (used by /api/chat)
CHAT_API=https://your-lambda-api.amazonaws.com/coach
CHAT_API_KEY=your-chat-api-key
COACH_MATCH_API=https://your-lambda-api.amazonaws.com/coach_match
```

## Future Optimizations

1. **Consider refactoring `/api/matches` to use a riot.ts function** instead of duplicating backend fetch logic

2. **Add React cache() wrapper** around expensive riot functions for request-level memoization
   ```typescript
   import { cache } from 'react';
   export const getProfileBundle = cache(async (region, gameName, tagLine) => {
     // ... implementation
   });
   ```

3. ✅ **COMPLETED: Split riot.ts into modular structure**
   - Now organized as lib/riot/ with separate files for types, fetchers, transformers
   - Better code organization and maintainability
   - Easier to find and modify specific functionality

4. **Remove `/api/account-info`** if not used by any client components

## Migration Notes

### What Changed

**Before:**
- All pages fetched from `/api/*` routes via HTTP
- 3-layer architecture for everything
- Unnecessary HTTP overhead for server components

**After:**
- Server components call riot.ts directly
- 2-layer architecture for server rendering
- API routes only for client component needs

### Breaking Changes

**None!** The refactoring is backward compatible:
- Client components still use API routes
- API routes still work the same way
- Just optimized server component data flow

## Testing

To verify the refactoring:

1. **Test Profile Pages:**
   ```
   Visit: /profile/EUW/[GameName]/[TagLine]
   Verify: Profile loads correctly
   ```

2. **Test Chronicle:**
   ```
   Visit: /profile/EUW/[GameName]/[TagLine]/chronicle
   Verify: Chronicle loads correctly
   ```

3. **Test Match Review:**
   ```
   Visit: /review/[MatchId]?puuid=[PUUID]
   Verify: Match data and timeline load
   ```

4. **Test Client Components:**
   ```
   - SearchCard: Enter gameName and tagLine → validates before navigation
   - MatchList: Click "Load More Matches" → loads additional matches
   - Chat: Ask a question → streams response
   ```

## Questions?

If you need to add new data fetching:

1. **For Server Components:** Add function to `riot.ts` and call it directly
2. **For Client Components:** Create API route that calls your `riot.ts` function
3. **Keep it simple:** Don't duplicate fetch logic between files

