# Design Guidelines: Salafiyyūn Arabic Text Translation App

## Design Approach
**Reference-Based Approach** - Primary inspiration from OpenAI.com with adaptations for Arabic text reading and translation workflow. Clean, modern, minimalist aesthetic with focus on readability and clarity.

## Core Design Elements

### Typography
**Primary Font Stack:**
- Arabic Text: "Noto Sans Arabic", "Traditional Arabic", serif (optimized for readability)
- Interface/Latin: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

**Hierarchy:**
- Hero Headlines: text-4xl to text-6xl, font-semibold
- Section Headers: text-2xl to text-3xl, font-semibold
- Arabic Body Text: text-lg to text-2xl (larger for readability, user-adjustable)
- Interface Text: text-sm to text-base
- Metadata/Captions: text-xs to text-sm, text-gray-600

### Layout System
**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8, space-y-12
- Card gaps: gap-4, gap-6
- Page margins: max-w-7xl mx-auto px-4

**Grid System:**
- Search results: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Reading layout: Single column max-w-4xl for optimal Arabic text reading
- Dashboard: 2-column layout (sidebar + content)

### Color Palette (Light Mode)
- **Primary Background:** #FFFFFF
- **Primary Accent:** #3B82F6 (Cobalt Blue) - CTAs, active states, links
- **Secondary Accent:** #8B5CF6 (Vibrant Purple) - highlights, special actions
- **Neutral Background:** #F3F4F6 (Light Gray) - cards, sections, inputs
- **Text Primary:** #111827 (Dark Gray)
- **Text Secondary:** #6B7280 (Medium Gray)
- **Borders:** #E5E7EB (Light border)

### Color Palette (Dark Mode)
- **Primary Background:** #0F172A (Dark Navy)
- **Primary Accent:** #3B82F6 (Cobalt Blue - same)
- **Secondary Accent:** #8B5CF6 (Vibrant Purple - same)
- **Neutral Background:** #1E293B (Slightly lighter navy)
- **Text Primary:** #F8FAFC (Off-white)
- **Text Secondary:** #94A3B8 (Light gray)
- **Borders:** #334155 (Dark border)

## Component Library

### Navigation
**Bottom Tab Navigation (Mobile-First):**
- 4 tabs: Home/Search, Library, Bookmarks, Profile
- Simple line icons (Heroicons), text labels below
- Active state: accent color + subtle background
- Fixed bottom position, subtle shadow, backdrop blur

**Top Header:**
- Logo/brand on left
- Settings icon and theme toggle on right
- Sticky positioning with blur backdrop
- Height: h-16, border-b in light gray

### Search Interface
**Search Bar:**
- Large, prominent input: h-12 to h-14
- Rounded-lg, border-2 focus state in primary blue
- Leading icon (search/magnifying glass)
- Placeholder in gray-500
- Clear button when populated

**Filters Panel:**
- Expandable accordion sections
- Filter chips for author, topic, era
- Pill-shaped filter tags with remove button
- Subtle background differentiation (F3F4F6)

**Search Results:**
- Card-based grid layout
- Each card: white background, rounded-lg, shadow-sm, hover:shadow-md
- Card contents: title (Arabic), author, excerpt preview
- "Read" CTA button in primary blue

### Reading Interface
**Text Display:**
- Generous padding: p-8 to p-12
- Line height: leading-loose to leading-relaxed
- White/dark background depending on mode
- Serif Arabic font for authenticity
- User-adjustable size controls (small/medium/large/extra-large)

**Translation Section:**
- Floating "Translate" button: fixed bottom-right
- Primary blue background, white text, shadow-lg
- Pulse animation when loading
- Translation appears in slide-up panel or inline below selected text
- Cached translations show instant green checkmark icon

**Controls Bar:**
- Top toolbar: zoom controls, highlight toggle, bookmark button
- Bottom toolbar: language toggle (Arabic/Italian), text size adjuster
- Icon buttons with subtle hover states

### Cards & Content Blocks
**Book/Text Cards:**
- Aspect ratio 3:4 or similar
- Rounded-lg corners
- Subtle shadow elevation
- Hover: lift effect (transform scale-102, shadow-lg)
- Content: cover-like top section with title, metadata below

**Translation Cache Indicator:**
- Small badge showing "Cached" or clock icon
- Green color for cached, gray for uncached
- Tooltip on hover explaining cache status

### Forms & Inputs
**Input Fields:**
- Height: h-11 to h-12
- Rounded-md borders
- Border-gray-300 default, border-blue-500 focus
- Focus ring with ring-2 ring-blue-500/20
- Consistent padding: px-4

**Buttons:**
- Primary: bg-blue-600, text-white, rounded-lg, px-6 py-3
- Secondary: bg-gray-200, text-gray-900, rounded-lg, px-6 py-3
- Text buttons: text-blue-600, hover:underline
- Disabled state: opacity-50, cursor-not-allowed
- **Buttons on images:** backdrop-blur-sm with semi-transparent background

### User Dashboard
**Profile/Settings:**
- 2-column layout on desktop, single column mobile
- Left sidebar: avatar, user info, navigation menu
- Right content area: settings panels, reading history, bookmarks list
- Card-based sections with consistent spacing

**Reading History:**
- Timeline-style list
- Each entry: book title, date, progress indicator
- Click to resume reading

**Bookmarks:**
- Grid of bookmarked texts/passages
- Quote preview in card
- Quick access to original text

## Special Features

### Arabic Text Highlighting
- Selection color: purple-200/30 (light mode), purple-500/20 (dark mode)
- Multi-line support with proper RTL handling
- Save highlights with user notes

### Loading States
- Skeleton screens for text loading
- Spinner overlay for translations: blue spinner, white/dark backdrop
- Progress indicators for long operations

### Toast Notifications
- Top-right corner positioning
- Success: green border-l-4 accent
- Error: red border-l-4 accent
- Info: blue border-l-4 accent
- Auto-dismiss after 4 seconds

## Animations
**Minimal, purposeful animations:**
- Page transitions: subtle fade, 200ms duration
- Card hover: scale-102 transform, 200ms ease
- Translation panel: slide-up entrance, 300ms ease-out
- Theme toggle: smooth color transition, 150ms
- NO scroll-triggered animations, NO parallax effects

## Images
**Usage:**
- Hero section: Abstract geometric patterns or Arabic calligraphy artwork (not required but optional for landing/about page)
- Book covers: Display actual book cover images if available from Shamela API
- User avatars: Circular, default placeholder with user initials
- Empty states: Minimal illustrations for "no results", "no bookmarks"

## Responsive Behavior
- Mobile-first approach
- Breakpoints: sm:640px, md:768px, lg:1024px, xl:1280px
- Single column on mobile, multi-column on tablet/desktop
- Bottom navigation on mobile, sidebar on desktop
- Touch-friendly targets: minimum 44x44px for interactive elements