# DNS + IP Intelligence SaaS - MVP Specification

## Project Overview
- **Project Name**: DNSIntel - DNS Security Debugging Platform
- **Type**: Web Application (Next.js)
- **Core Functionality**: Developer-focused DNS security and debugging suite with IP intelligence visualization
- **Target Users**: DevOps engineers, security researchers, penetration testers, developers debugging DNS issues

## UI/UX Specification

### Layout Structure
- **Header**: Fixed top navigation with logo, main nav links, and user actions
- **Sidebar**: Collapsible left sidebar for tool navigation (280px expanded)
- **Main Content**: Fluid content area with tool interfaces
- **Footer**: Minimal footer with status indicators

### Responsive Breakpoints
- Mobile: < 768px (sidebar hidden, hamburger menu)
- Tablet: 768px - 1024px (collapsed sidebar)
- Desktop: > 1024px (full layout)

### Visual Design

#### Color Palette
- **Background Primary**: #0a0a0f (deep space black)
- **Background Secondary**: #12121a (card backgrounds)
- **Background Tertiary**: #1a1a24 (elevated elements)
- **Accent Primary**: #00d4aa (cyber teal - primary actions)
- **Accent Secondary**: #7c3aed (electric violet - secondary accent)
- **Accent Warning**: #f59e0b (amber - warnings)
- **Accent Danger**: #ef4444 (red - errors/critical)
- **Accent Success**: #10b981 (emerald - success states)
- **Text Primary**: #f4f4f5 (zinc-100)
- **Text Secondary**: #a1a1aa (zinc-400)
- **Text Muted**: #71717a (zinc-500)
- **Border Color**: #27272a (zinc-800)

#### Typography
- **Font Family**: "JetBrains Mono" for code/data, "Outfit" for UI text
- **Headings**: Outfit, weights 600-700
  - H1: 2.5rem
  - H2: 1.875rem
  - H3: 1.5rem
  - H4: 1.25rem
- **Body**: Outfit 400, 1rem, line-height 1.6
- **Code/Data**: JetBrains Mono 400, 0.875rem

#### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64px
- Card padding: 24px
- Section gaps: 32px

#### Visual Effects
- Card shadows: 0 4px 24px rgba(0, 212, 170, 0.05)
- Glow effects: 0 0 20px rgba(0, 212, 170, 0.15) on hover
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Glassmorphism: backdrop-blur(12px) on overlays

### Components

#### Navigation Sidebar
- Tool icons with labels
- Active state: teal left border + teal text
- Hover: background lighten to #1a1a24

#### DNS Lookup Panel
- Domain input field with validation
- Record type selector (A, AAAA, MX, TXT, CNAME, NS, SOA)
- Results table with expandable rows
- Copy-to-clipboard buttons
- History sidebar

#### IP Intelligence Card
- IP address display with copy button
- ASN information
- Geolocation map (simple visual)
- Network ownership
- Abuse contact info

#### Infrastructure Graph
- Force-directed graph visualization using D3.js
- Nodes: domains, IPs, nameservers
- Edges: relationships (DNS lookups, CNAME chains)
- Zoom/pan controls
- Node highlighting on hover

#### Attack Surface Panel
- Risk score gauge (0-100)
- Issue categories with counts
- Severity indicators (critical, high, medium, low)
- Remediation suggestions

#### Status Badges
- Online: emerald dot
- Offline: red dot
- Warning: amber dot
- Unknown: gray dot

## Functionality Specification

### Core Features

1. **DNS Lookup Tool**
   - Query any domain for DNS records
   - Support record types: A, AAAA, MX, TXT, CNAME, NS, SOA, PTR, SRV
   - Display TTL values
   - Show response time
   - History of recent lookups (localStorage)

2. **IP Intelligence**
   - IP geolocation lookup
   - ASN information (via ip-api.com free tier)
   - Reverse DNS lookup
   - Port availability check (common ports)

3. **Infrastructure Visualization**
   - Map DNS relationships as interactive graph
   - Show CNAME chains
   - Display nameserver hierarchies
   - Export graph as PNG

4. **Attack Surface Analysis**
   - Basic DNS configuration checks
   - SPF record validation
   - DMARC record check
   - DNSSEC status
   - Common misconfiguration detection

5. **Ephemeral Subdomain Testing**
   - Generate test subdomains
   - Quick DNS propagation check
   - SSL certificate lookup

### User Interactions
- Real-time DNS queries with loading states
- Keyboard shortcuts (Ctrl+Enter to lookup)
- Drag-to-reorder graph nodes
- Click-to-expand detailed views
- Export results as JSON/CSV

### Data Handling
- Client-side DNS resolution via DNS-over-HTTPS APIs
- IP data from ip-api.com (free tier)
- Local storage for history and preferences
- No backend required for MVP

### Edge Cases
- Handle DNS resolution failures gracefully
- Show rate limiting messages for API limits
- Handle invalid domain formats
- Handle timeout scenarios (10s timeout)
- Empty results handling

## Acceptance Criteria

1. ✅ User can input a domain and receive DNS record results
2. ✅ User can select different record types
3. ✅ IP lookup returns geolocation and ASN data
4. ✅ Infrastructure graph renders and is interactive
5. ✅ Attack surface analysis provides actionable insights
6. ✅ UI is responsive and works on mobile
7. ✅ Dark theme is consistent across all components
8. ✅ Loading states are shown during queries
9. ✅ Error states are handled gracefully
10. ✅ History is persisted in localStorage
