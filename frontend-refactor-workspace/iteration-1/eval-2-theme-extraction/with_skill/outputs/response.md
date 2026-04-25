# Next.js Theme Extraction and Centralization Plan

## Overview
This plan consolidates scattered theme values from `src/styles/constants.ts`, `src/lib/theme.ts`, and hardcoded component values into a centralized `theme/` folder structure with clear separation of concerns.

## Phase 1: Create Centralized Theme Structure

### 1.1 Create `src/theme/colors.ts`
This file serves as the single source of truth for all color values.

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#6366F1',
  secondary: '#EC4899',
  // Add other colors from src/styles/constants.ts
  background: '#FFFFFF',
  text: '#000000',
  border: '#E5E7EB',
  // Additional semantic colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

export type Color = typeof colors[keyof typeof colors];
```

### 1.2 Create `src/theme/typography.ts`
This file centralizes all font sizes, weights, line heights, and font families.

```typescript
// src/theme/typography.ts
export const typography = {
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
} as const;

// Preset typography combinations for components
export const typographyPresets = {
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
} as const;
```

### 1.3 Create `src/theme/spacing.ts`
This file centralizes all spacing values, margins, and padding scales.

```typescript
// src/theme/spacing.ts
export const spacing = {
  0: '0px',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const breakpoints = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1536px',
} as const;

export const borderRadius = {
  none: '0px',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;
```

### 1.4 Create `src/theme/index.ts`
This is the main export file that aggregates all theme values and creates the MUI theme object.

```typescript
// src/theme/index.ts
import { createTheme as muiCreateTheme } from '@mui/material/styles';
import { colors } from './colors';
import { typography, typographyPresets } from './typography';
import { spacing, breakpoints, borderRadius, shadows } from './spacing';

// Export all theme tokens for direct usage in components
export { colors } from './colors';
export { typography, typographyPresets } from './typography';
export { spacing, breakpoints, borderRadius, shadows } from './spacing';

// Create MUI theme using centralized tokens
export const theme = muiCreateTheme({
  palette: {
    primary: {
      main: colors.primary,
    },
    secondary: {
      main: colors.secondary,
    },
    background: {
      default: colors.background,
      paper: colors.background,
    },
    text: {
      primary: colors.text,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    success: {
      main: colors.success,
    },
  },
  typography: {
    fontFamily: typography.fontFamily.base,
    h1: typographyPresets.h1,
    h2: typographyPresets.h2,
    h3: typographyPresets.h3,
    body1: typographyPresets.body,
    body2: typographyPresets.body,
    caption: typographyPresets.caption,
  },
  spacing: (factor) => `${factor * 4}px`, // 4px base unit
  breakpoints: {
    values: {
      xs: 0,
      sm: parseInt(breakpoints.mobile),
      md: parseInt(breakpoints.tablet),
      lg: parseInt(breakpoints.desktop),
      xl: parseInt(breakpoints.wide),
    },
  },
});

export type Theme = typeof theme;
```

## Phase 2: Update Existing Files

### 2.1 Refactor `src/styles/constants.ts`
Replace with imports from the new theme structure.

**Before:**
```typescript
export const PRIMARY = '#6366F1';
export const SECONDARY = '#EC4899';
export const FONT_SIZES = {
  small: '12px',
  medium: '16px',
  large: '20px',
};
```

**After:**
```typescript
// Deprecated: Use src/theme imports instead
// This file is maintained for backwards compatibility during migration

export { colors as COLOR_CONSTANTS } from '../theme/colors';
export { typography, typographyPresets } from '../theme/typography';
export { spacing, breakpoints } from '../theme/spacing';

// Direct aliases for gradual migration
export const PRIMARY = '#6366F1'; // Migrate to: import { colors } from '@/theme'
export const SECONDARY = '#EC4899'; // Migrate to: import { colors } from '@/theme'
```

### 2.2 Refactor `src/lib/theme.ts`
Replace with import from the centralized theme.

**Before:**
```typescript
import { createTheme } from '@mui/material/styles';
import { PRIMARY, SECONDARY, FONT_SIZES } from '../styles/constants';

export const createTheme = () => {
  return createTheme({
    palette: {
      primary: { main: PRIMARY },
      secondary: { main: SECONDARY },
    },
    spacing: [0, 4, 8, 16, 24, 32],
    breakpoints: {
      values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 },
    },
  });
};
```

**After:**
```typescript
// Consolidated theme exported from centralized location
export { theme, colors, typography, spacing, breakpoints } from '@/theme';
```

## Phase 3: Replace Hardcoded Values in Components

### 3.1 Pattern for Component Updates
Replace all hardcoded color/spacing/typography values with imports from the theme.

**Example Component Before:**
```typescript
// src/components/Button.tsx
const Button = () => (
  <button style={{
    backgroundColor: '#6366F1',
    padding: '16px 24px',
    fontSize: '16px',
    borderRadius: '8px',
  }}>
    Click me
  </button>
);
```

**Example Component After:**
```typescript
// src/components/Button.tsx
import { colors, spacing, typography, borderRadius } from '@/theme';

const Button = () => (
  <button style={{
    backgroundColor: colors.primary,
    padding: `${spacing[4]} ${spacing[6]}`,
    fontSize: typography.fontSize.base,
    borderRadius: borderRadius.lg,
  }}>
    Click me
  </button>
);
```

### 3.2 Common Replacements Map
| Hardcoded Value | Theme Import |
|-----------------|-------------|
| `'#6366F1'` | `colors.primary` |
| `'#EC4899'` | `colors.secondary` |
| `'16px'` | `spacing[4]` |
| `'24px'` | `spacing[6]` |
| `'32px'` | `spacing[8]` |
| `'1rem'` | `typography.fontSize.base` |
| `'8px'` | `borderRadius.lg` |

### 3.3 Implementation Strategy
1. Use find-and-replace with regex patterns for common values
2. Manually verify each component for semantic appropriateness
3. Update component imports to use theme tokens
4. Run type checks to ensure correctness

## Phase 4: Validation & Testing

### 4.1 Functional Validation Checklist
- [ ] All colors render identically to before refactoring
- [ ] Typography sizes and weights display correctly
- [ ] Spacing/padding/margins match original layouts
- [ ] MUI components receive correct theme tokens
- [ ] No CSS class conflicts or style collisions
- [ ] Breakpoints work identically on responsive designs

### 4.2 Type Safety Validation
```bash
# Verify TypeScript compilation
npx tsc --noEmit

# Check for any remaining hardcoded color values
grep -r "#[0-9A-Fa-f]\{6\}" src/components/ --include="*.tsx" --include="*.ts"

# Verify all imports are resolvable
npx tsc --noEmit --traceResolution
```

### 4.3 Regression Testing
- Visual regression: Compare screenshots before/after
- Component storybook: Verify all component states
- E2E tests: Run full test suite to ensure no functionality breaks
- Theme switching (if applicable): Test theme switching mechanisms

### 4.4 Coverage Verification
Run a comprehensive grep to identify any remaining hardcoded values:

```bash
# Find potential hardcoded colors in JSX/TSX
grep -rE "(\bcolor|background|fill|stroke):\s*['\"]#[0-9A-Fa-f]{3,6}['\"]" src/

# Find potential hardcoded spacing
grep -rE "(\bpadding|margin|gap):\s*['\"](\d+px|[\d.]+rem)['\"]" src/

# Find potential hardcoded font sizes
grep -rE "(\bfontSize):\s*['\"](\d+px|[\d.]+rem)['\"]" src/
```

## Phase 5: Migration Roadmap

### Step 1: Initial Setup (1-2 hours)
- Create theme folder structure
- Create colors.ts, typography.ts, spacing.ts
- Create theme/index.ts with MUI integration
- Update imports in src/styles/constants.ts and src/lib/theme.ts

### Step 2: Component Migration (2-4 hours)
- Update components one module at a time
- Prioritize high-usage components first
- Verify each component visually before moving to next

### Step 3: Validation (1-2 hours)
- Run all validation scripts
- Compare visual output before/after
- Run full test suite

### Step 4: Cleanup (30 minutes)
- Remove deprecated constants from old files
- Update documentation/comments
- Remove any import aliases

## Expected Outcomes

1. **Single Source of Truth**: All theme values defined in one centralized location
2. **Type Safety**: Full TypeScript support with autocomplete for theme tokens
3. **Consistency**: Ensures all components use the same colors, spacing, typography
4. **Maintainability**: Easy to update theme globally without touching components
5. **Scalability**: Simple to add new theme tokens or variants
6. **Zero Functional Changes**: All visual and behavioral aspects remain identical

## Files to Create
- `src/theme/colors.ts`
- `src/theme/typography.ts`
- `src/theme/spacing.ts`
- `src/theme/index.ts`

## Files to Modify
- `src/styles/constants.ts` (backwards compatibility layer)
- `src/lib/theme.ts` (export from new location)
- All component files with hardcoded values

## Files to Delete (Optional)
- `src/styles/constants.ts` (after full migration)
- `src/lib/theme.ts` (after full migration, keep as re-export if needed)
