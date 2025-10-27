# Design Guidelines for Data Discovery Tool

## Design Approach
**System-Based Approach**: This is a utility-focused, productivity tool for Salesforce consultants. The design prioritizes efficiency, learnability, and data clarity over visual flair. Follow the provided design system exactly.

---

## Color Palette (Strict Usage Rules)

### Primary Colors
- **Primary Orange** (`primary-*`): CTAs, save buttons, primary actions ONLY
- **Secondary Blue** (`secondary-*`): Navigation, informational elements, secondary actions
- **Tertiary Green** (`tertiary-*`): Decorative accents ONLY (NOT for success states)

### Utility Colors
- **Success**: `success-500` (#2ABF3C) - Checkmarks, completed status
- **Danger**: `danger-500` (#E74B3C) - Delete actions, critical flags, errors
- **Warning**: `warning-500` (#FFC700) - Caution flags, important notes
- **Info**: `info-500` (#4AA0D9) - Informational messages

### Neutral Palette (CoolGray - 90% of UI)
- **Backgrounds**: `coolgray-50` (page), `coolgray-100` (base), `white` (cards)
- **Text**: `coolgray-600` (primary text), `coolgray-500` (secondary text)
- **Borders**: `coolgray-200`
- **Disabled**: `coolgray-400`

---

## Typography System

**Font Families**:
- Sans: Inter (UI text)
- Mono: JetBrains Mono (technical/code content)

**Hierarchy**:
1. **Page Title**: `text-2xl font-bold text-coolgray-600`
2. **Section Header**: `text-xl font-bold text-coolgray-600`
3. **Card Title**: `text-lg font-semibold text-coolgray-600`
4. **Body Text**: `text-base text-coolgray-600`
5. **Label**: `text-sm font-medium text-coolgray-500`
6. **Caption**: `text-xs text-coolgray-500`
7. **Code/Technical**: `font-mono text-sm`

---

## Spacing Scale (4px Base Unit)

Use ONLY these spacing values:
- `0`: 0px
- `1`: 4px
- `2`: 8px
- `3`: 12px
- `4`: 16px (most common)
- `5`: 20px
- `6`: 24px
- `8`: 32px (section spacing)
- `10`: 40px
- `12`: 48px
- `16`: 64px
- `20`: 80px
- `24`: 96px

**Common Patterns**:
- Padding inside cards: `p-4` or `p-6`
- Gap between elements: `gap-2`, `gap-4`
- Section margins: `mb-8`, `mt-8`
- Button padding: `px-4 py-2`

---

## Shape System

**Border Radius**:
- Buttons: `rounded-lg` (8px)
- Cards: `rounded-xl` (12px)
- Inputs: `rounded-md` (4px)
- Badges/Pills: `rounded-full`
- Small elements: `rounded-sm` (2px)

**Elevation**:
- Standard: `shadow-md`
- Modals/Overlays: `shadow-lg`
- Subtle: `shadow-sm`

---

## Component Patterns

### Buttons
```
Primary Action: bg-primary-500 hover:bg-primary-600 text-white rounded-lg shadow-md px-4 py-2
Secondary Action: bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg shadow-md px-4 py-2
Outline: border-2 border-coolgray-200 hover:border-coolgray-300 text-coolgray-600 rounded-lg px-4 py-2
Danger: bg-danger-500 hover:bg-danger-700 text-white rounded-lg shadow-md px-4 py-2
```

### Cards
```
bg-white rounded-xl shadow-md border border-coolgray-200 p-6
```

### Inputs
```
border border-coolgray-200 rounded-md px-3 py-2 text-base focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500
```

### Badges
```
px-3 py-1 rounded-full text-xs font-medium
Success: bg-success-50 text-success-700
Danger: bg-danger-50 text-danger-700
Warning: bg-warning-50 text-warning-700
Info: bg-info-50 text-info-700
```

---

## Layout Structure

### Application Shell
- **Sticky Navbar**: `bg-coolgray-50 border-b border-coolgray-200 shadow-md sticky top-0 z-50`
- **Page Background**: `bg-coolgray-50`
- **Content Padding**: `px-4 py-3` (navbar), `p-6` (main content)

### Graph View (Interactive ERD Canvas)
- **Canvas Background**: `bg-white` or subtle grid pattern
- **Entity Nodes**: Draggable cards with `bg-white rounded-xl shadow-md border-2`
- **Selected Node**: `border-secondary-500`
- **Relationship Lines**: `stroke-coolgray-400` with arrowheads, labels showing cardinality
- **Hover State**: Subtle shadow increase, no color change

### Table View
- **Header Row**: `bg-coolgray-100 border-b-2 border-coolgray-200 font-semibold`
- **Data Rows**: `bg-white border-b border-coolgray-200 hover:bg-coolgray-50`
- **Zebra Striping**: Optional `odd:bg-coolgray-50`

---

## Visual Hierarchy Principles

1. **Information Density**: Professional, data-rich layouts. Avoid excessive whitespace.
2. **Contrast**: Use shadow-md and borders to create depth, not just color.
3. **Focus States**: Always use `focus:ring` and `focus:border` for keyboard navigation.
4. **Icon Consistency**: Use lucide-react icons at h-4 w-4 (small) or h-5 w-5 (medium).
5. **Status Indicators**: Use colored dots or badges, never rely on color alone.

---

## Accessibility Requirements

- All interactive elements: `focus:ring-2 focus:ring-secondary-500`
- Sufficient contrast ratios (coolgray-600 text on white backgrounds)
- Icon-only buttons must have `aria-label`
- Keyboard navigation: Tab order follows visual flow
- PII indicators must have visual markers beyond color (lock icon)

---

## No Images/Illustrations

This is a data-focused productivity tool. No hero images, decorative graphics, or illustrations. All visual communication through typography, iconography, and structured layouts.