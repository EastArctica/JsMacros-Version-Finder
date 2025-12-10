# JsMacros Version Finder – Implementation Plan

## Goals
- Static, client-only site to help users pick the correct JsMacros build by Minecraft version, mod loader, extensions, and fork.
- Data is a hand-maintained JSON file under `data/builds.json` ("depth-based" by Minecraft version), fetched at runtime.
- Two core UX flows:
  1) **Guide flow**: user selects MC version → mod loader → sees matching builds, can toggle extensions to refine.
  2) **List view**: searchable/sortable table of all builds (search/sort limited to this view).
- Dark theme by default; clean UI; React + Vite + TypeScript. shadcn/ui is optional; we can use its component patterns with a Vite-compatible setup.

## Data Model (depth-based JSON)
File: `data/builds.json`
```json
{
  "updatedAt": "2025-01-05",
  "versions": {
    "1.19.1": [
      {
        "id": "jsmacros-2.1.0-1.19.1-fabric",
        "repo": "JsMacros/JsMacros",               
        "commit": "<sha>",
        "fork": "JsMacros",                        
        "jsMacrosVersion": "2.1.0",                
        "modLoader": ["fabric"],                   
        "extensions": ["luaj", "js", "jython"], 
        "downloads": [
          {
            "name": "jsmacros-2.1.0-1.19.1-fabric.jar",
            "platform": "fabric",                 
            "url": "https://.../jsmacros-2.1.0-1.19.1-fabric.jar",
            "checksum": "sha256:...",
            "notes": "Optional field"
          }
        ],
        "releaseType": "release",                  
        "status": "supported",                     
        "publishedAt": "2024-12-10",               
        "notes": "Requires Fabric API >= 0.102"
      }
    ],
    "1.21.1": [
      {
        "id": "jsmacros-2.1.0-1.21.1-fabric",
        "repo": "JsMacros/JsMacros",
        "commit": "<sha>",
        "fork": "JsMacros",
        "jsMacrosVersion": "2.1.0",
        "modLoader": ["fabric"],
        "extensions": ["luaj", "js", "jython"],
        "downloads": [
          {
            "name": "jsmacros-2.1.0-1.21.1-fabric.jar",
            "platform": "fabric",
            "url": "https://.../jsmacros-2.1.0-1.21.1-fabric.jar",
            "checksum": "sha256:..."
          }
        ],
        "releaseType": "release",
        "status": "supported",
        "publishedAt": "2024-12-20"
      }
    ]
  }
}
```

### Field notes
- `versions`: keys are exact Minecraft versions (minor updates matter). No quilt support.
- `modLoader`: array to allow multi-loader builds; allowed: `fabric | forge | neoforge`.
- `platform` in downloads: `fabric | forge | neoforge | extension | ts | other` (matches your idea).
- `releaseType`: `release | beta | nightly`; `status`: `supported | deprecated | experimental` (can omit if N/A).
- Optional fields: `notes`, `publishedAt`, `checksum`, `commit`, `fork` (useful if build comes from a fork), `sources` (global array) if desired.
- Keep `id` stable per build for client-side keys and potential bookmarks.

### Possible missing bits
- `javaVersion` requirement? (skip unless needed).
- `requires`: array of dependent mods/APIs (e.g., Fabric API version) if you want to surface compatibility.
- `changelogUrl` or `releaseUrl` for GitHub Releases.

## UI/UX Breakdown
- **Header**: project title, short blurb, "Data last updated" badge from JSON, GitHub icon linking to contribution doc.
- **Guide flow (primary path)**:
  - Step 1: select Minecraft version (dropdown grouped by major, but still listing minors).
  - Step 2: select mod loader (fabric/forge/neoforge).
  - Step 3: show matching builds with extension badges; optional checkboxes to highlight preferred extensions.
  - Handle no-results with clear guidance.
- **List view (secondary)**:
  - Table with search + sort limited to this table.
  - Columns: MC version, JsMacros version, fork, loaders, extensions, releaseType/status, published date, download action.
  - Row expander/drawer for notes, checksum, commit, repo link.
- **Theming**: dark default; clean cards/badges. If using shadcn-style components, keep to a minimal set (button, select, tabs, table, badges, accordion).
- **Routing/state**: single page with tabs for Guide/List; sync filters to query params for shareable links (nice-to-have).

## Tech Stack & Tooling
- Vite + React + TypeScript.
- Styling: shadcn/ui (Vite-compatible) or a slim alternative; Tailwind is optional but works well with shadcn patterns; otherwise lightweight CSS modules.
- Validation: Node/TypeScript script that validates `data/builds.json` against a Zod schema; GitHub Action runs it on PRs.

## Files to add
- `data/builds.json` – real data (manually edited).
- `data/README.md` – schema description and contribution steps.
- `scripts/validate.ts` – Zod schema validator for the JSON.
- `.github/workflows/validate-data.yml` – runs `npm ci` + `npm run validate:data`.
- App code (later): Vite scaffolding, components for Guide/List, dark theme styles.

## Delivery Milestones
1) Lock schema + sample data + validator + CI.
2) Scaffold Vite (React + TS), add shadcn-style components or minimal UI kit.
3) Implement data loading + types + utility selectors.
4) Build Guide flow (version → loader → extensions filter) with clear empty states.
5) Build List view (search/sort limited here) with expandable rows and badges.
6) Polish (dark theme, responsive layout, updated-at banner, contribution link).
7) Deploy (GitHub Pages/Netlify) and document data update steps.
