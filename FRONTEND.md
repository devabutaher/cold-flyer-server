# Cold Flyer - Project Documentation

This documentation is designed for AI models to understand the project structure, styling, and patterns to help make informed decisions when creating components or making changes.

## Project Overview

- **Project Name**: Cold Flyer
- **Type**: E-commerce website for AC (Air Conditioning) products and services
- **Framework**: Next.js 16.2.4 with React 19.2.4
- **Build Tool**: Turbopack

## Tech Stack

- **Frontend**: Next.js 16.2.4, React 19.2.4, React DOM 19.2.4
- **Styling**: Tailwind CSS 4, class-variance-authority, tailwind-merge
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Animations**: Motion 12.38.0, Embla Carousel 8.6.0
- **Icons**: Lucide React 1.11.0, React Icons 5.6.0
- **Forms**: React Hook Form 7.74.0, Zod 4.3.6, @hookform/resolvers
- **Backend**: Firebase 12.12.1 (Auth, Firestore)
- **Fonts**: Google Fonts - Inter (sans), Lora (serif), Geist Mono (mono)
- **Utilities**: clsx, twMerge, papaparse, xlsx, react-zoom-pan-pinch

## Color Theme

All colors are defined in `src/app/globals.css` using OKLCH color space.

### Primary Colors

| Color Variable | Value | Usage |
|----------------|-------|-------|
| `--background` | oklch(0.994 0 0) | Page background (off-white) |
| `--foreground` | oklch(0 0 0) | Primary text (black) |
| `--primary` | oklch(0.6404 0.2153 35.9003) | Primary actions, CTAs (blue) |
| `--primary-foreground` | oklch(1 0 0) | Text on primary (white) |

### Secondary Colors

| Color Variable | Value | Usage |
|----------------|-------|-------|
| `--secondary` | oklch(0.954 0.0063 255.4755) | Secondary backgrounds |
| `--secondary-foreground` | oklch(0.1344 0 0) | Secondary text |
| `--accent` | oklch(0.9656 0.0176 39.4009) | Accent elements |
| `--accent-foreground` | oklch(0.5581 0.1911 35.3377) | Text on accent |

### Neutral & UI Colors

| Color Variable | Value | Usage |
|----------------|-------|-------|
| `--muted` | oklch(0.9702 0 0) | Muted backgrounds |
| `--muted-foreground` | oklch(0.4386 0 0) | Muted text |
| `--card` | oklch(0.994 0 0) | Card backgrounds |
| `--card-foreground` | oklch(0 0 0) | Card text |
| `--popover` | oklch(0.9911 0 0) | Popover backgrounds |
| `--popover-foreground` | oklch(0 0 0) | Popover text |
| `--border` | oklch(0.93 0.0094 286.2156) | Border color (light gray) |
| `--input` | oklch(0.9401 0 0) | Input backgrounds |
| `--ring` | oklch(0.6404 0.2153 35.9003) | Focus ring |

### Semantic Colors

| Color Variable | Value | Usage |
|----------------|-------|-------|
| `--destructive` | oklch(0.629 0.1902 23.0704) | Error/delete actions |
| `--destructive-foreground` | oklch(1 0 0) | Text on destructive |

### Sidebar Colors

| Color Variable | Value |
|----------------|-------|
| `--sidebar` | oklch(0.99 0 0) |
| `--sidebar-foreground` | oklch(0 0 0) |
| `--sidebar-primary` | oklch(0 0 0) |
| `--sidebar-primary-foreground` | oklch(1 0 0) |
| `--sidebar-accent` | oklch(0.94 0 0) |
| `--sidebar-accent-foreground` | oklch(0 0 0) |
| `--sidebar-border` | oklch(0.94 0 0) |
| `--sidebar-ring` | oklch(0 0 0) |

### Chart Colors

| Color Variable | Value |
|----------------|-------|
| `--chart-1` | oklch(0.6404 0.2153 35.9003) |
| `--chart-2` | oklch(0.8231 0.0995 30.7543) |
| `--chart-3` | oklch(0.7336 0.1758 50.5517) |
| `--chart-4` | oklch(0.5828 0.1809 259.7276) |
| `--chart-5` | oklch(0.886 0.123 84.7452) |

## Typography

Fonts are loaded via `next/font/google` in `src/app/layout.jsx`:

| Font Variable | Font Name | Usage |
|---------------|-----------|-------|
| `--font-sans` | Inter | Default body text |
| `--font-serif` | Lora | Serif headings/accent |
| `--font-mono` | Geist Mono | Code/monospace |

### Font CSS Variables

```css
--font-sans: Inter, ui-sans-serif, sans-serif, system-ui;
--font-serif: Lora, serif;
--font-mono: Geist Mono, monospace;
```

## Spacing & Sizing

```css
--radius: 0.5rem;
--spacing: 0.27rem;
```

## Shadows

Shadows are defined with OKLCH color support:

```css
--shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
--shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
--shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
--shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
--shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
--shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
--shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
--shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
```

## Utility Function

The project uses a `cn()` utility for combining classes:

```javascript
// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

## Component System

This project uses **shadcn/ui** style components:

- **Style**: radix-vega
- **Icon Library**: Lucide
- **Path Alias**: `@/*` maps to `./src/*`

### Component Location

- UI Components: `src/components/ui/`
- Layout Components: `src/components/layout/`
- Product Components: `src/components/products/`
- Home Components: `src/components/home/`
- Auth Components: `src/components/auth/`
- Services Components: `src/components/services/`

### Available UI Components

Located in `src/components/ui/`:

| Component | File | Description |
|-----------|------|-------------|
| Button | button.jsx | Primary action button with variants (default, outline, secondary, ghost, destructive, link) and sizes (xs, sm, default, lg, xl, icon) |
| Card | card.jsx | Card container |
| Input | input.jsx | Text input field |
| Badge | badge.jsx | Label/tag component |
| Avatar | avatar.jsx | User avatar |
| Checkbox | checkbox.jsx | Checkbox input |
| Select | select.jsx | Dropdown select |
| Tabs | tabs.jsx | Tab navigation |
| Table | table.jsx | Data table |
| Dialog | sheet.jsx | Modal/drawer (using Sheet from Radix) |
| Dropdown Menu | dropdown-menu.jsx | Dropdown menu |
| Tooltip | tooltip.jsx | Tooltip popup |
| Accordion | accordion.jsx | Collapsible accordion |
| Separator | separator.jsx | Horizontal divider |
| Skeleton | skeleton.jsx | Loading placeholder |
| Pagination | pagination.jsx | Pagination controls |
| Textarea | textarea.jsx | Multi-line text input |
| Label | label.jsx | Form label |
| Radio Group | radio-group.jsx | Radio button group |
| Breadcrumb | breadcrumb.jsx | Breadcrumb navigation |
| Button Group | button-group.jsx | Grouped buttons |
| Alert Dialog | alert-dialog.jsx | Confirmation dialog |
| Infinite Slider | infinite-slider.jsx | Infinite scrolling slider |
| Text Slider | text-slider.jsx | Text animation slider |
| Filter Dropdown | filter-dropdown.jsx | Filter control |
| File Upload | file-upload.jsx | File upload component |
| Quantity Input | quantity-input.jsx | Quantity selector |
| Price Format | price-format.jsx | Price display formatter |
| Decor Icon | decor-icon.jsx | Decorative icon |
| Collapsible | collapsible.jsx | Collapsible content |
| Kbd | kbd.jsx | Keyboard key display |
| Input Group | input-group.jsx | Input group container |
| Field | field.jsx | Form field wrapper |
| Auth Divider | auth-divider.jsx | Auth page divider |
| Pagination | pagination.jsx | Pagination UI |
| Sidebar | sidebar.jsx | Dashboard sidebar |
| Logo | logo.jsx | Logo component |
| Navigation Menu | navigation-menu.jsx | Navigation menu |
| Pagination | pagination.jsx | Pagination component |

## Folder Structure

```
cold-flyer/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (public)/           # Public routes
│   │   │   ├── page.jsx        # Home page
│   │   │   ├── items/          # Products pages
│   │   │   │   ├── page.jsx    # All products
│   │   │   │   ├── ac_units/   # AC units
│   │   │   │   └── [id]/       # Product detail
│   │   │   ├── services/       # Services pages
│   │   │   └── terms/          # Terms page
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── layout.jsx          # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── not-found.jsx       # 404 page
│   ├── components/
│   │   ├── ui/                 # shadcn UI components
│   │   ├── layout/
│   │   │   └── navbar/        # Navigation components
│   │   ├── products/          # Product components
│   │   ├── home/              # Home page components
│   │   ├── auth/              # Auth components
│   │   └── common/            # Shared components
│   ├── data/                  # Static data files
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── context/               # React context
│   └── styles/
├── components.json            # shadcn configuration
├── package.json
└── next.config.js
```

## Route Structure

### Public Routes (`(public)`)

| Route | Page | Description |
|-------|------|-------------|
| `/` | page.jsx | Home/Landing page |
| `/items` | items/page.jsx | All products listing |
| `/items/ac_units` | items/ac_units/page.jsx | AC units products |
| `/items/[id]` | items/[id]/page.jsx | Product detail page |
| `/services` | services/page.jsx | Services listing |
| `/terms` | terms/page.jsx | Terms & conditions |

### Dashboard Routes (`(dashboard)`)

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | dashboard/page.jsx | Dashboard home |
| `/dashboard/items` | dashboard/items/page.jsx | Manage products |
| `/dashboard/items/add` | dashboard/items/add/page.jsx | Add new product |

## Data Schemas

### Product Schema

Products are stored in `src/data/products-data.js`:

```javascript
{
  id: string,           // Unique identifier (e.g., "u1")
  tag: string | null,   // Badge tag (e.g., "Best Seller")
  name: string,        // Product name
  sub: string,         // Short description
  price: number,       // Current price
  originalPrice: number, // Original/marked price
  img: string,         // Image URL
  stock: number,       // Stock count
  sku: string,         // SKU code
  brand: string,       // Brand name
  category: string,    // Category (e.g., "Split AC")
  warranty: string,   // Warranty period
  rating: number,     // Rating (e.g., 4.8)
  reviewCount: number, // Number of reviews
  features: string[], // Feature list
  specs: {             // Specifications object
    capacity: string,
    voltage: string,
    powerInput: string,
    coverageArea: string,
    noiseLevel: string,
    refrigerant: string,
    starRating: string,
    compressorType: string,
    dimensions: string
  },
  inBox: string[]      // Items included in box
}
```

### Nav Links

From `src/data/nav-links.js`:

```javascript
productLinks = [
  { label: string, href: string, icon: ReactNode },
  // e.g., { label: "All Products", href: "/items", icon: <LayoutGrid /> }
]

serviceLinks = [
  { label: string, href: string, icon: ReactNode },
  // e.g., { label: "Installation", href: "/services/installation", icon: <Settings /> }
]
```

## Custom Hooks

Located in `src/hooks/`:

| Hook | File | Description |
|------|------|-------------|
| useScroll | use-scroll.js | Scroll position tracking |
| useMobile | use-mobile.js | Mobile detection |
| useProductSearch | use-product-search.js | Product search functionality |
| useLazyRef | use-lazy-ref.js | Lazy ref management |
| useIsomorphicLayoutEffect | use-isomorphic-layout-effect.js | SSR-safe layout effect |
| useEmblaSlider | use-embla-slider.js | Embla carousel integration |
| useCounter | use-counter.js | Counter state |
| useAsRef | use-as-ref.js | Ref conversion |

## Button Variants Reference

When creating or modifying buttons, use these variants:

```
variant: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
size: "xs" | "sm" | "default" | "lg" | "xl" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"
```

## Tailwind CSS v4 Usage

This project uses Tailwind CSS v4 with the new `@import "tailwindcss"` syntax in `globals.css`. Theme variables are defined using `@theme inline` block.

## How to Make Changes

### Adding a New Component

1. Create component in appropriate folder (e.g., `src/components/products/`)
2. Use `cn()` utility from `@/lib/utils` for class merging
3. Import icons from `lucide-react`
4. Follow existing component patterns

### Styling Guidelines

1. Use CSS variables for colors (e.g., `bg-primary`, `text-foreground`)
2. Use Tailwind utility classes with CSS variables
3. Follow shadcn/ui style conventions

### Adding New Pages

1. Create folder under `src/app/` using route naming convention
2. Use `(route-group)` syntax for route groups
3. Export `metadata` object for page title/description

### Modifying Colors/Theme

Edit `src/app/globals.css` - modify OKLCH values in `:root` and `@theme inline` blocks.

## Example: Creating a New Product Card

```jsx
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }) {
  return (
    <div className="border border-border rounded-lg p-4">
      {product.tag && (
        <Badge variant="secondary">{product.tag}</Badge>
      )}
      <img src={product.img} alt={product.name} />
      <h3 className="text-lg font-medium">{product.name}</h3>
      <p className="text-muted-foreground">{product.sub}</p>
      <div className="flex items-center gap-2">
        <span className="text-primary font-bold">${product.price}</span>
        <span className="text-muted-foreground line-through">${product.originalPrice}</span>
      </div>
      <Button>Add to Cart</Button>
    </div>
  );
}
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Notes for AI Models

1. Always use `cn()` from `@/lib/utils` for combining Tailwind classes
2. Use OKLCH color values defined in CSS variables - don't use arbitrary hex/HSL colors
3. Follow the existing component patterns and file organization
4. Use Radix UI primitives for complex interactive components
5. Import icons from `lucide-react` (primary) or `react-icons` (additional)
6. Use the shadcn/ui component structure for consistency