# CSS Architecture Refactoring Plan

## Current State Analysis

### CSS Distribution Overview

The project currently uses a hybrid approach:

- **Tailwind CSS**: Base utilities, some custom colors/tokens in `tailwind.config.ts`
- **CSS Modules**: Component-specific styles with heavy custom CSS
- **Global CSS**: Basic resets and CSS variables in `app/globals.css`

### Component CSS Module Analysis

#### `app/dashboard/dashboard.module.css` (Primary Analysis)

**Extractable to Tailwind Utilities:**

- Button styles with consistent hover effects
- Card layouts with gradient backgrounds
- Modal styling patterns
- Responsive breakpoint patterns
- Common spacing and typography patterns

**Keep as Component-Specific:**

- Complex grid layouts (`.boardsGrid`)
- Component-specific positioning
- Unique hover animations

#### `app/board/[id]/board.module.css`

**Extractable Patterns:**

- Cell styling for bingo grid
- Progress indicators
- Mobile-responsive grid systems

## Proposed Global Utility Classes

### 1. Component Base Classes

```css
/* Add to app/globals.css using @layer components */
@layer components {
  .card-base {
    @apply bg-white rounded-xl shadow-large;
  }

  .card-interactive {
    @apply card-base transition-all duration-300 hover:shadow-xl hover:-translate-y-1;
  }

  .btn-primary {
    @apply px-5 py-2.5 bg-accent-purple text-white font-medium rounded-lg shadow-medium cursor-pointer transition-all duration-200;
    @apply hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-large;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-secondary-500 text-white font-medium rounded-lg shadow-soft cursor-pointer transition-all duration-200;
    @apply hover:bg-secondary-600 hover:-translate-y-0.5 hover:shadow-medium;
  }

  .modal-base {
    @apply bg-white rounded-xl shadow-xl p-8 max-w-lg w-11/12;
  }

  .gradient-card {
    @apply bg-gradient-to-br from-accent-purple to-accent-indigo text-white rounded-xl shadow-medium;
  }
}
```

### 2. Layout Utilities

```css
@layer utilities {
  .page-container {
    @apply min-h-screen bg-gray-50;
  }

  .content-container {
    @apply max-w-6xl mx-auto px-6 py-10;
  }

  .mobile-padding {
    @apply px-4 md:px-6 lg:px-8;
  }
}
```

## Migration Strategy

### Phase 1: Extract Common Patterns (Week 1)

1. **Add component base classes** to `app/globals.css`
2. **Create utility documentation** for team reference
3. **Test component classes** in isolation

### Phase 2: Migrate Dashboard Component (Week 2)

1. Replace button styles with `.btn-primary` and `.btn-secondary`
2. Convert card styles to use `.card-interactive` and `.gradient-card`
3. Replace modal styles with `.modal-base`
4. Update responsive patterns to use Tailwind breakpoints

### Phase 3: Migrate Board Components (Week 3)

1. Extract grid patterns to Tailwind utilities
2. Convert cell styles to component classes
3. Standardize progress indicator styling

### Phase 4: Cleanup and Optimization (Week 4)

1. Remove unused CSS from component modules
2. Audit for remaining extractable patterns
3. Performance testing and optimization

## Before/After Examples

### Dashboard Header Migration

**Before (CSS Module):**

```css
.header {
  background: white;
  border-bottom: 2px solid #e1e8ed;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 3px 0px rgba(0, 0, 0, 0.05);
}
```

**After (Tailwind):**

```jsx
<header className="bg-white border-b-2 border-gray-200 px-6 py-4 flex justify-between items-center shadow-soft">
```

### Button Migration

**Before (CSS Module):**

```css
.createBtn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

**After (Tailwind):**

```jsx
<button className="btn-primary">Create Board</button>
```

## Best Practices for Future Development

### 1. Utility-First Approach

- Use Tailwind utilities for 80% of styling needs
- Reserve CSS modules for complex, component-specific layouts
- Prefer composition over custom CSS

### 2. Component Styling Hierarchy

```
1. Tailwind utilities (spacing, colors, typography)
2. Global component classes (buttons, cards, modals)
3. CSS modules (complex layouts, unique positioning)
4. Inline styles (dynamic values only)
```

### 3. Responsive Design Patterns

```jsx
// Mobile-first with consistent breakpoints
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
```

### 4. Design Consistency Guidelines

- Use existing shadow utilities (soft, medium, large, xl)
- Apply consistent border-radius patterns
- Maintain hover animations for interactivity
- Follow established color scheme

## Recommended Tools & Patterns

### 1. CSS-in-JS Alternatives (Future Consideration)

- **Stitches**: Type-safe CSS-in-JS with variants
- **Vanilla Extract**: Zero-runtime CSS-in-JS
- **CVA (Class Variance Authority)**: Utility for creating component variants

### 2. Design System Organization

```
/styles
  /components     # Global component classes
  /utilities      # Custom Tailwind utilities
  /tokens         # Design tokens and variables
```

### 3. Component Composition Pattern

```jsx
// Preferred pattern for reusable components
const Card = ({
  variant = "default",
  interactive = false,
  children,
  ...props
}) => {
  const baseClasses = "card-base";
  const variantClasses = {
    default: "",
    gradient: "gradient-card",
    interactive: "card-interactive",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        interactive && "card-interactive"
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

## Performance Considerations

### Bundle Size Optimization

- Use Tailwind's purge configuration to remove unused styles
- Lazy load component-specific CSS modules
- Monitor CSS bundle size during migration

### Runtime Performance

- Prefer CSS classes over inline styles
- Use CSS transforms for animations (GPU acceleration)
- Minimize layout thrashing with proper CSS containment

## Success Metrics

### Code Quality

- [ ] Reduce component CSS module size by 60%
- [ ] Increase Tailwind utility usage to 80%
- [ ] Maintain 100% visual consistency

### Developer Experience

- [ ] Reduce time to style new components by 50%
- [ ] Improve style consistency across components
- [ ] Simplify responsive design implementation

### Performance

- [ ] Maintain or improve CSS bundle size
- [ ] No regression in Core Web Vitals
- [ ] Faster component rendering times
