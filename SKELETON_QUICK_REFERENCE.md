# Skeleton Loaders - Quick Reference Guide

## 🚀 Quick Start

### Add Skeleton to Any Page (5 Steps)

```bash
# 1. Import the skeleton
import { DashboardSkeleton } from '@/components/skeletons';

# 2. Add loading state
const [isLoading, setIsLoading] = useState(true);

# 3. Fetch data and update state
useEffect(() => {
  // fetch data
  setIsLoading(false);
}, []);

# 4. Return skeleton during loading
if (isLoading) return <DashboardSkeleton />;

# 5. Return content when loaded
return <div>Your content</div>;
```

## 📋 Skeleton Mapping

### Pages → Skeleton Components

| Page | Skeleton | Import |
|------|----------|--------|
| `/dashboard` | DashboardSkeleton | `import { DashboardSkeleton } from '@/components/skeletons'` |
| `/my-tasks` | TaskListSkeleton | `import { TaskListSkeleton } from '@/components/skeletons'` |
| `/planner` | PlannerSkeleton | `import { PlannerSkeleton } from '@/components/skeletons'` |
| `/teams` | TeamsSkeleton | `import { TeamsSkeleton } from '@/components/skeletons'` |
| `/projects/[id]` | ProjectDetailSkeleton | `import { ProjectDetailSkeleton } from '@/components/skeletons'` |
| `/settings` | SettingsSkeleton | `import { SettingsSkeleton } from '@/components/skeletons'` |
| `/members` | MembersSkeleton | `import { MembersSkeleton } from '@/components/skeletons'` |
| `/history` | HistorySkeleton | `import { HistorySkeleton } from '@/components/skeletons'` |
| `/workflows` | WorkflowsSkeleton | `import { WorkflowsSkeleton } from '@/components/skeletons'` |
| `/ai` | AiSkeleton | `import { AiSkeleton } from '@/components/skeletons'` |

## 🎨 Visual Examples

### DashboardSkeleton
```
Light Theme                  Dark Theme
─────────────────          ─────────────────
█████ Hero Banner      ████ Hero Banner
█ █ █ Project Cards    █ █ █ Project Cards
███ Stats Cards        ███ Stats Cards
```

### TaskListSkeleton
```
Light Theme                  Dark Theme
─────────────────          ─────────────────
██ Header               ██ Header
█ Filters              █ Filters
█ Task 1               █ Task 1
█ Task 2               █ Task 2
█ Task 3               █ Task 3
```

### TeamsSkeleton
```
Light Theme                  Dark Theme
─────────────────          ─────────────────
██ Header               ██ Header
████ Team Card 1        ████ Team Card 1
████ Team Card 2        ████ Team Card 2
████ Team Card 3        ████ Team Card 3
```

## 🌙 Theme Colors Reference

### Light Theme
```
Background:  #ffffff (white)
Card:        #ffffff (white)
Muted:       oklch(0.97 0 0) (light gray ~#f5f5f5)
Border:      oklch(0.922 0 0) (very light gray ~#ececec)
Text:        oklch(0.145 0 0) (dark text)
```

### Dark Theme
```
Background: #1e1f21 (dark gray)
Card:       #232426 (slightly lighter gray)
Muted:      #2a2b2e (medium gray)
Border:     #333438 (light dark gray)
Text:       #e5e5e5 (light text)
```

## 🔧 Common Patterns

### Pattern 1: Simple Loading State
```tsx
'use client';
import { DashboardSkeleton } from '@/components/skeletons';
import { useState, useEffect } from 'react';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardSkeleton />;
  
  return <div>{/* content */}</div>;
}
```

### Pattern 2: With Store Integration
```tsx
'use client';
import { ProjectDetailSkeleton } from '@/components/skeletons';
import { useProjectStore } from '@/store/projectStore';
import { useEffect } from 'react';

export default function Page() {
  const projects = useProjectStore(s => s.projects);
  const isLoading = useProjectStore(s => s.isLoading);
  
  if (isLoading) return <ProjectDetailSkeleton />;
  
  return <div>{/* content */}</div>;
}
```

### Pattern 3: With Suspense (Server Component)
```tsx
import { Suspense } from 'react';
import { TaskListSkeleton } from '@/components/skeletons';

async function TaskContent() {
  const data = await fetchTasks();
  return <div>{/* content */}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<TaskListSkeleton />}>
      <TaskContent />
    </Suspense>
  );
}
```

## ✨ Features

### ✅ Already Built-In
- [x] Theme awareness (light/dark)
- [x] Responsive design (mobile + desktop)
- [x] Pulse animation
- [x] Proper spacing and layouts
- [x] No layout shift
- [x] CSS variables for colors

### ✅ Automatically Handled
- [x] Color switching when theme changes
- [x] Smooth animations
- [x] Semantic HTML structure
- [x] Accessibility friendly

## 🎯 Implementation Checklist

For each page you want to update:

- [ ] Choose the appropriate skeleton component
- [ ] Import the skeleton: `import { XxxSkeleton } from '@/components/skeletons'`
- [ ] Add loading state: `const [loading, setLoading] = useState(true)`
- [ ] Fetch data and set loading to false
- [ ] Add early return: `if (loading) return <XxxSkeleton />`
- [ ] Test with light theme
- [ ] Test with dark theme
- [ ] Test theme switching
- [ ] Verify no layout shift

## 📚 Available Components

```
components/skeletons/
├── DashboardSkeleton.tsx
├── TaskListSkeleton.tsx
├── PlannerSkeleton.tsx
├── TeamsSkeleton.tsx
├── ProjectDetailSkeleton.tsx
├── SettingsSkeleton.tsx
├── MembersSkeleton.tsx
├── HistorySkeleton.tsx
├── WorkflowsSkeleton.tsx
├── AiSkeleton.tsx
└── index.ts (exports all)
```

## 🎨 Customization

To create a custom skeleton for a unique page:

```tsx
// components/skeletons/CustomPageSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomPageSkeleton() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1e1f21] p-6">
      {/* Your custom skeleton structure */}
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

Then export from `components/skeletons/index.ts`:
```ts
export { default as CustomPageSkeleton } from './CustomPageSkeleton';
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Skeleton not showing | Ensure `loading` state is true when page first loads |
| Wrong colors | Check theme is properly set in `globals.css` |
| Layout shift | Ensure skeleton dimensions match content |
| Animations not working | Verify `animate-pulse` class is in Tailwind config |
| Theme not switching | Check `next-themes` is properly configured |

## 📖 For More Info

- **Full Guide**: See `SKELETON_LOADERS_GUIDE.md`
- **Implementation Status**: See `SKELETON_IMPLEMENTATION_SUMMARY.md`
- **Theme Configuration**: See `app/globals.css`
- **Provider Setup**: See `components/theme-provider.tsx`

## 💡 Pro Tips

1. **Keep skeletons proportional** to actual content for better UX
2. **Test theme switching** to ensure colors work in both modes
3. **Monitor performance** to verify skeletons improve perceived speed
4. **Reuse components** - same skeleton can work on multiple similar pages
5. **Keep it simple** - more complex skeletons aren't always better

---

**Last Updated**: 2024-11-17  
**Status**: ✅ Ready to use
