# Skeleton Loaders Implementation Guide

## Overview
This app now has theme-aware skeleton loaders for all major pages. The skeletons automatically adapt to light and dark themes using CSS variables and Tailwind's `dark:` modifier.

## Available Skeleton Components

All skeleton components are located in `components/skeletons/` and exported from `components/skeletons/index.ts`:

### Core Skeletons
- **DashboardSkeleton** - For dashboard/overview page
- **TaskListSkeleton** - For my-tasks page, task lists
- **PlannerSkeleton** - For planner/calendar page
- **TeamsSkeleton** - For teams management page
- **ProjectDetailSkeleton** - For project detail views
- **SettingsSkeleton** - For settings/preferences pages
- **MembersSkeleton** - For members/team listing
- **HistorySkeleton** - For activity/history timeline
- **WorkflowsSkeleton** - For workflows page
- **AiSkeleton** - For AI chat interface

## Theme System

### How It Works
The app uses `next-themes` for theme management and CSS custom properties for color values:

**Light Theme (default)**
```css
:root {
  --background: oklch(1 0 0);           /* White */
  --card: oklch(1 0 0);                 /* White */
  --muted: oklch(0.97 0 0);             /* Light gray */
  --border: oklch(0.922 0 0);           /* Very light gray */
}
```

**Dark Theme**
```css
.dark {
  --background: #1e1f21;                /* Dark gray */
  --card: #232426;                      /* Slightly lighter gray */
  --muted: #2a2b2e;                     /* Medium gray */
  --border: #333438;                    /* Light dark gray */
}
```

### Skeleton Colors
- Base color class: `bg-muted` (light: light gray, dark: #2a2b2e)
- Explicit dark colors: `dark:bg-[#2a2b2e]`, `dark:bg-[#232426]`, etc.
- Borders: `border-border` / `dark:border-[#333438]`

## Implementation Pattern

### 1. Import the Skeleton
```tsx
import { DashboardSkeleton } from '@/components/skeletons';
```

### 2. Add Loading State
```tsx
'use client';

import { useState, useEffect } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

export default function PageName() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Your data fetching logic
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    // Your actual page content
  );
}
```

### 3. Using with Suspense (Server Components)
```tsx
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons';

function PageContent() {
  // Page content
}

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
```

## Already Implemented Pages

✅ **Dashboard** (`app/(app)/dashboard/page.tsx`)
- Uses DashboardSkeleton
- Shows loading state while fetching projects and workspace data

✅ **My Tasks** (`app/(app)/my-tasks/page.tsx`)
- Uses TaskListSkeleton
- Shows loading state during task fetch

## Pages Ready for Implementation

The following pages can easily integrate skeleton loaders:

### Planner (`app/(app)/planner/page.tsx`)
```tsx
// Add at top
import { PlannerSkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <PlannerSkeleton />;
```

### Teams (`app/(app)/teams/page.tsx`)
```tsx
// Add at top
import { TeamsSkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <TeamsSkeleton />;
```

### Projects Detail (`app/(app)/projects/[id]/page.tsx`)
```tsx
// Add at top
import { ProjectDetailSkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <ProjectDetailSkeleton />;
```

### Settings (`app/(app)/settings/page.tsx`)
```tsx
// Already imports Skeleton
// Can be updated to use SettingsSkeleton for better UX

import { SettingsSkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <SettingsSkeleton />;
```

### Members (`app/(app)/members/page.tsx`)
```tsx
// Add at top
import { MembersSkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <MembersSkeleton />;
```

### History (`app/(app)/history/page.tsx`)
```tsx
// Add at top
import { HistorySkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <HistorySkeleton />;
```

### Workflows (`app/(app)/workflows/page.tsx`)
```tsx
// Add at top
import { WorkflowsSkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <WorkflowsSkeleton />;
```

### AI (`app/(app)/ai/page.tsx`)
```tsx
// Add at top
import { AiSkeleton } from '@/components/skeletons';

// In component
if (isLoading) return <AiSkeleton />;
```

## Customizing Skeletons

### For Page-Specific Needs
Create custom skeletons in `components/skeletons/CustomPageNameSkeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomPageNameSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21]">
      {/* Your custom skeleton structure matching your page layout */}
      <Skeleton className="h-6 w-48 mb-4" />
      {/* More skeleton elements */}
    </div>
  );
}
```

### Key Styling Classes
- **Background**: Use `bg-background dark:bg-[#1e1f21]` for page background
- **Cards**: Use `bg-card dark:bg-[#232426]`
- **Muted areas**: Use `bg-muted dark:bg-[#1e1f21]`
- **Borders**: Use `border-border dark:border-[#333438]`
- **Skeleton elements**: Use `<Skeleton>` component (automatically handles theming)

## Testing Theme Switching

1. **Test Light Theme**
   - Toggle theme to light
   - Load a page with skeleton
   - Verify skeleton uses light colors

2. **Test Dark Theme**
   - Toggle theme to dark
   - Load a page with skeleton
   - Verify skeleton uses dark colors

3. **Test Transitions**
   - Load page → see skeleton
   - Data loads → content appears
   - Verify smooth transition

## Performance Tips

1. **Keep Skeleton Size Similar**: Skeleton should roughly match content size to avoid layout shift
2. **Use Realistic Structure**: Mirror your actual content layout in skeleton
3. **Animate Pulses**: The `animate-pulse` class creates a breathing effect
4. **Avoid Over-nesting**: Keep skeleton structure simple and flat when possible

## Troubleshooting

### Skeleton Not Showing
- Check if `isLoading` state is being set correctly
- Verify import path is correct: `@/components/skeletons`
- Ensure page is using 'use client' directive

### Wrong Colors in Theme
- Check that dark classes are properly applied
- Verify CSS variables in `globals.css` match expected colors
- Test with inspector: check computed styles

### Layout Shift
- Ensure skeleton has same dimensions as content
- Use `min-h-screen` for full-page skeletons
- Avoid padding differences between skeleton and content

## Adding New Pages

For any new page:
1. Create skeleton: `components/skeletons/NewPageSkeleton.tsx`
2. Export from: `components/skeletons/index.ts`
3. Import and use in page component
4. Test with both light and dark themes

## Resources

- **Theme Provider**: `components/theme-provider.tsx`
- **Global Styles**: `app/globals.css`
- **Skeleton Component**: `components/ui/skeleton.tsx`
- **All Skeletons**: `components/skeletons/`
