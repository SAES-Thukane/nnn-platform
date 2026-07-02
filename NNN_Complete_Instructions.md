# Never Not Nice — Complete Build Instructions
### Industry Standard Edition · Visual Studio · Every Step Documented

---

## HOW THIS GUIDE WORKS

The zip file `nnn-platform-v2.zip` contains every file already written.
This guide tells you what each file does, where it goes, and every step
to take from opening the zip to having a live, deployed, industry-standard website.

Follow every step in order. Do not skip ahead.

---

## BEFORE YOU START — Accounts

Create these three free accounts if you haven't already.
Do this before touching any files.

| Account | URL | Purpose |
|---|---|---|
| Supabase | https://supabase.com | Your database and live data API |
| GitHub | https://github.com | Stores your code, triggers auto-deploy |
| Vercel | https://vercel.com | Hosts the live website (sign up with GitHub) |

When signing up for Vercel — use the **Continue with GitHub** option.
This links them automatically and makes deployment one click.

---

## PHASE 1 — Extract and Open the Project

### Step 1 — Extract the zip

1. Locate `nnn-platform-v2.zip` in your Downloads folder
2. Right-click it → **Extract All**
3. Choose a destination — your Desktop is fine for now
4. Click **Extract**

You now have a folder called `nnn-v2` containing this structure:

```
nnn-v2/
├── index.html              Home page
├── events.html             Events, countdown, IP grid
├── gallery.html            Photo gallery grid
├── about.html              Brand story
├── services.html           Service offerings
├── contact.html            Contact form and info
├── 404.html                Branded error page
├── vercel.json             Security headers and API routing rules
├── robots.txt              Tells search engines what to crawl
├── sitemap.xml             Google indexing map of all pages
├── NNN_Industry_Standard_Build_Guide.md   (this guide)
├── css/
│   └── globals.css         All fonts, colours, animations, components
├── js/
│   ├── config.js           API fetch helper — calls your proxy, no keys
│   ├── nav.js              Mobile hamburger + sticky scroll behaviour
│   ├── home.js             Fetches hero content from Supabase
│   ├── events.js           Fetches IPs, countdown target, calendar rows
│   ├── gallery.js          Fetches gallery collections and builds grid
│   └── countdown.js        Reusable live countdown clock utility
├── api/
│   └── supabase.js         Serverless proxy — your keys never reach the browser
└── assets/
    ├── nice-logo.png       Your NICE mark (already placed, inverted to white by CSS)
    └── README.txt          Instructions for adding og-cover.jpg
```

### Step 2 — Open the project in Visual Studio

1. Open Visual Studio (the purple one)
2. Go to **File → Open → Folder**
3. Navigate to and select the `nnn-v2` folder
4. Click **Select Folder**

Visual Studio opens the project. You will see all files listed in the
**Solution Explorer** panel on the right.

Do not rename any files or folders. The HTML pages reference each other
and reference the JS and CSS files by exact name and path.

---

## PHASE 2 — Build Your Database in Supabase

### Step 3 — Create the Supabase project

1. Log into https://supabase.com
2. Click **New Project**
3. Fill in:
   - **Name:** `nnn-platform`
   - **Database Password:** create a strong one — save it in a notes doc
   - **Region:** South Africa (Cape Town) or closest available
4. Click **Create new project**
5. Wait approximately 2 minutes for the project to provision

### Step 4 — Run the SQL blocks

In the left sidebar click **SQL Editor**, then click **New query**.

You will run 5 blocks. For each one:
paste the block → click **Run** → wait for the green success message → paste the next one.

---

#### SQL Block 1 — global_settings table
This controls your hero headline, CTA button text and link, and company email.
All of this is editable from the Supabase dashboard without touching code.

```sql
CREATE TABLE global_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_headline text NOT NULL,
  hero_cta_text text NOT NULL,
  hero_cta_target_page text NOT NULL,
  company_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

INSERT INTO global_settings (
  hero_headline,
  hero_cta_text,
  hero_cta_target_page,
  company_email
)
VALUES (
  'Never Not Nice. Curating JHB''s subculture archives.',
  'ENTER THE ARCHIVE',
  'events.html',
  'hello@nevernotnice.co.za'
);
```

**What this does:** Creates the table and inserts your first live record.
The website reads this record on every page load and injects the content into the DOM.

---

#### SQL Block 2 — intellectual_properties table
This powers the sub-brand cards on the Events page — Between Us, Archive,
and any future IPs you add.

```sql
CREATE TABLE intellectual_properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_name text NOT NULL,
  tagline text,
  description text,
  badge_status text,
  is_active_campaign boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

INSERT INTO intellectual_properties (
  ip_name,
  tagline,
  description,
  badge_status,
  is_active_campaign
)
VALUES
  (
    'Between Us (BÜ)',
    'The flagship. The community.',
    'Between Us is JHB''s most intimate curated event series — bringing together underground music, art, and culture since day one.',
    'Flagship',
    true
  ),
  (
    'Archive',
    'Where subculture is preserved.',
    'An ultra-exclusive underground music and fashion concept. Limited access. Maximum impact.',
    'Launching August 1st',
    true
  );
```

**What this does:** Creates the table and seeds it with your two current IPs.
To add a third IP in future, just insert a new row in the Supabase Table Editor.

---

#### SQL Block 3 — events_calendar table
This drives the live calendar rows, the ticket button states, and feeds the
countdown clock with the target date.

```sql
CREATE TABLE events_calendar (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  associated_ip uuid REFERENCES intellectual_properties(id),
  event_date timestamptz NOT NULL,
  city text NOT NULL,
  venue text NOT NULL,
  ticket_status text CHECK (
    ticket_status IN ('Available', 'Sold Out', 'Upcoming')
  ) DEFAULT 'Upcoming',
  ticket_redirect_url text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO events_calendar (
  event_name,
  event_date,
  city,
  venue,
  ticket_status,
  ticket_redirect_url
)
VALUES
  (
    'Archive — Launch Night',
    '2025-08-01 20:00:00+02',
    'Joburg',
    'TBA',
    'Upcoming',
    'https://tickets.nevernotnice.co.za'
  ),
  (
    'Between Us Vol. 12',
    '2025-09-14 19:00:00+02',
    'Joburg',
    'TBA',
    'Available',
    'https://tickets.nevernotnice.co.za'
  );
```

**What this does:** Creates the table with a built-in constraint so only
'Available', 'Sold Out', or 'Upcoming' are valid ticket status values.
Seeds two events. The countdown clock automatically targets the soonest
non-sold-out event.

**Important:** Dates must always include the `+02` timezone offset for
South Africa Standard Time. Without it the countdown will be 2 hours off.

---

#### SQL Block 4 — gallery_archives table
This powers the gallery grid. Each row becomes one card on the gallery page,
linking out to your Pixieset collection.

```sql
CREATE TABLE gallery_archives (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_title text NOT NULL,
  event_city text,
  event_date_text text,
  cover_image_url text,
  white_label_subdomain_url text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO gallery_archives (
  collection_title,
  event_city,
  event_date_text,
  cover_image_url,
  white_label_subdomain_url
)
VALUES
  (
    'Soundset Sunday',
    'Joburg',
    '12 April',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    'https://gallery.nevernotnice.co.za/jhb-april'
  ),
  (
    'Between Us Vol. 11',
    'Joburg',
    '18 May',
    'https://images.unsplash.com/photo-1540039155733-5bb30b4f5e62?w=800',
    'https://gallery.nevernotnice.co.za/jhb-may'
  );
```

**What this does:** Creates the gallery table and seeds it with two placeholder
collections using Unsplash images. Replace the `cover_image_url` values with
your actual event cover photos once you have them, and replace the
`white_label_subdomain_url` values with your real Pixieset collection links.

---

#### SQL Block 5 — Row Level Security
This is the access control layer. The public website can only ever READ data.
Nobody on the internet can write, edit, or delete through the website.
Only you can do that from the Supabase dashboard using your admin credentials.

```sql
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE intellectual_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON global_settings
  FOR SELECT USING (true);

CREATE POLICY "Public read" ON intellectual_properties
  FOR SELECT USING (true);

CREATE POLICY "Public read" ON events_calendar
  FOR SELECT USING (true);

CREATE POLICY "Public read" ON gallery_archives
  FOR SELECT USING (true);
```

**What this does:** Locks down the tables with read-only public access.
This runs once and never needs to be touched again.

---

### Step 5 — Save your API credentials

1. In Supabase left sidebar: **Project Settings → API**
2. Copy and save these two values into a private notes document:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon / public key** — long string starting with `eyJ...`

**Do not paste these into any code file.**
They go into Vercel's environment variables dashboard in Phase 4.
This is what keeps your credentials secure — they never touch your codebase.

### Step 6 — Enable 2FA on Supabase

1. Top right of Supabase → click your avatar → **Account**
2. Go to **Security → Enable Two-Factor Authentication**
3. Follow the setup with an authenticator app (Google Authenticator or Authy)

Your Supabase account controls the entire live database.
If it gets compromised, your site data is gone. Do this now.

---

## PHASE 3 — Understand What Each File Does

Before you deploy anything, read this section so you know what's happening
when you preview the site and why certain pages need certain scripts.

---

### vercel.json
**Purpose:** Configuration file that Vercel reads on every deployment.

**What it does:**
- Routes any request to `/api/*` to your serverless function in the `api/` folder
- Adds 7 security headers to every response from your site:
  - `X-Content-Type-Options` — prevents MIME sniffing attacks
  - `X-Frame-Options: DENY` — prevents your site being embedded in iframes (clickjacking)
  - `X-XSS-Protection` — browser-level XSS filter
  - `Referrer-Policy` — controls what URL info is sent to external sites
  - `Permissions-Policy` — blocks camera, microphone, geolocation access
  - `Content-Security-Policy` — whitelists exactly which external scripts and fonts are allowed
  - `Strict-Transport-Security` — forces HTTPS for 2 years, prevents downgrade attacks

**You never edit this file** unless you add a new external script source,
in which case you'd add it to the `script-src` directive in the CSP header.

---

### robots.txt
**Purpose:** Instructions for search engine crawlers.

**What it does:**
- Tells all crawlers they are allowed to index the entire site (`Allow: /`)
- Points Google to your sitemap so it knows all six pages exist

**When to edit:** When your domain is confirmed, this file already has
`nevernotnice.co.za` in the sitemap URL. No changes needed.

---

### sitemap.xml
**Purpose:** Map of all pages on your site submitted to search engines.

**What it does:**
- Lists all 6 public pages with their full URLs
- Assigns priority scores (home = 1.0, events = 0.9, gallery = 0.8, others = 0.7/0.6)
- Tells crawlers how often each page changes (events and gallery = weekly)

**When to edit:** When your domain is confirmed, do a find-and-replace:
replace `nevernotnice.co.za` with your actual confirmed domain across this file.

---

### api/supabase.js
**Purpose:** The security layer between your website and Supabase.

**What it does:**
This is a Vercel Serverless Function. When your website needs data, it does not
call Supabase directly. Instead it calls `/api/supabase?table=events_calendar`.
Vercel runs this file server-side, reads your secret keys from environment
variables, calls Supabase, and returns the data to the browser.

Your Supabase keys are never in any file that reaches the browser.
They never appear in the browser's network tab. They are not in your GitHub repo.

**The table whitelist:** The function only allows requests for these four tables:
`global_settings`, `intellectual_properties`, `events_calendar`, `gallery_archives`.
Any other request returns a 400 error. This prevents anyone from probing
your database for other data.

**Cache header:** Responses are cached on Vercel's CDN for 60 seconds.
This means the site is fast and Supabase isn't hammered with a request
on every single page view.

**You never edit this file** unless you add a fifth data table,
in which case you add its name to the `ALLOWED_TABLES` array.

---

### css/globals.css
**Purpose:** The entire visual design system for the site.

**What it does:**
- Imports Space Grotesk and Space Mono from Google Fonts
- Defines CSS variables (design tokens) in the `:root` block — every
  colour, font, spacing value, radius, and transition lives here
- Styles every component: nav, buttons, IP cards, event rows, gallery cards,
  countdown clock, skeleton loaders, error states, contact form fields, footer
- Handles responsive breakpoints for mobile

**When to edit:** During UI polish phase. Every visual change starts here.
The `:root` block is your control panel:

```css
:root {
  --color-bg:           #080808;   ← background colour
  --color-text-primary: #f0f0f0;   ← main text colour
  --color-text-muted:   #888888;   ← secondary text
  --color-text-faint:   #444444;   ← labels and captions
  --color-accent:       #ffffff;   ← buttons and highlights
  --font-display: 'Space Grotesk', sans-serif;  ← body font
  --font-mono:    'Space Mono', monospace;       ← labels and code
}
```

Change any value here and it cascades to every page automatically.

**The grain texture:** The `body::after` block creates the film grain overlay.
Delete that block to remove it completely.

---

### js/config.js
**Purpose:** The shared fetch function used by every page script.

**What it does:**
Defines one function — `nnnFetch(table, params)` — that every other JS file calls.
It builds the URL to your `/api/supabase` proxy and handles the fetch.
This file has zero credentials in it. It simply knows the route to your proxy.

**Why this matters:** If you ever change the proxy URL, you change it in
one place and every page updates automatically.

**You never edit this file.**

---

### js/nav.js
**Purpose:** Controls all navigation behaviour across every page.

**What it does:**
Three jobs:

1. **Hamburger toggle** — listens for clicks on `#nav-toggle`, toggles `hidden`
   class on `#mobile-menu`, updates `aria-expanded` for accessibility.
   Also closes the menu when any link inside it is tapped — critical for
   Instagram and TikTok in-app browsers which behave differently to Safari/Chrome.

2. **Sticky scroll** — adds `nav--scrolled` class to `#main-nav` when
   the user scrolls past 40px. This class switches the nav background
   from transparent to `rgba(8,8,8,0.96)` with blur. Removes the class
   when scrolled back to top.

3. **Active link detection** — reads the current page filename from
   `window.location.pathname`, finds the matching nav link, and adds
   `nav-link--active` class so the current page is highlighted.
   This means you never need to manually mark active links in HTML.

**You never edit this file.**

---

### js/countdown.js
**Purpose:** Reusable countdown clock utility.

**What it does:**
Exports one function — `startCountdown(isoDateString, elementId)`.
Called from `events.js` with the next event's date and the ID of the
countdown container element.

The function:
- Parses the ISO date string (including timezone)
- Calculates days, hours, minutes, seconds remaining
- Injects the formatted clock HTML into the target element
- Uses `setTimeout` to call itself every 1000ms (1 second)
- When the countdown reaches zero, replaces the clock with a live indicator
  showing a pulsing green dot and "Event is Live"
- Validates the date string — if it's invalid, shows an error gracefully

**You never edit this file.**

---

### js/home.js
**Purpose:** Fetches from `global_settings` and updates the home page DOM.

**What it does:**
On page load, calls `nnnFetch('global_settings', 'limit=1')`.
Takes the first record returned and injects:
- `hero_headline` into the `#hero-headline` element
- `hero_cta_text` into the `#hero-cta` element
- `hero_cta_target_page` as the `href` on `#hero-cta`
- `company_email` into every element with class `.contact-email`

**Fail silently:** If the fetch fails, the static fallback text already in
the HTML remains visible. The user never sees a broken page.

**Used on:** `index.html` and `contact.html` (for the email injection).

---

### js/events.js
**Purpose:** Drives the entire events page — three separate fetch operations.

**Section 1 — IP Brand Grid:**
Fetches `intellectual_properties` ordered by creation date.
Maps each record to an `<article class="ip-card">` with the name, badge,
tagline, and description.
Shows an error state if the fetch fails.

**Section 2 — Countdown:**
Fetches `events_calendar` filtered to exclude Sold Out events, ordered by date,
limited to 1 result — this gives the soonest upcoming event.
Passes its `event_date` to `startCountdown()`.
If no upcoming events exist, hides the entire countdown section with `hidden = true`.

**Section 3 — Events Calendar List:**
Fetches all events ordered by date.
For each event, determines the ticket status and renders accordingly:
- `Available` with a URL → clickable white "Get Tickets →" button
- `Upcoming` → grey "Coming Soon" badge, no link
- `Sold Out` → darker "Sold Out" badge, no link, button detached

All dynamic content is passed through `escapeHtml()` before being
inserted into the DOM. This prevents XSS attacks from malicious data.

---

### js/gallery.js
**Purpose:** Fetches `gallery_archives` and builds the photo grid.

**What it does:**
Fetches all gallery collections ordered newest first.
For each record, builds a gallery card with:
- The cover image with `loading="lazy"` and explicit `width`/`height` to
  prevent layout shift
- An `onerror` handler that shows a graceful fallback if the image URL breaks
- A default label overlay (always visible)
- A hover overlay (visible on hover/tap) with a "View Gallery →" CTA

Clicking or tapping any card opens the `white_label_subdomain_url` in a
new tab, taking the user into the full Pixieset gallery experience.

Shows a skeleton loader grid while fetching.
Shows an empty state if no collections exist.
Shows an error state with a retry button if the fetch fails.

---

### HTML pages — shared structure

Every HTML page follows the same pattern:

```
<head>
  Primary meta tags (title, description, theme-color, canonical URL)
  Open Graph tags (og:title, og:description, og:image, og:url)
  Twitter Card tags
  Font preconnect links (speeds up Google Fonts loading)
  globals.css link
  Tailwind CDN script
  Vercel Analytics script (deferred — doesn't block page load)
</head>
<body>
  <nav id="main-nav">
    Logo image (nice-logo.png, inverted white by CSS)
    Desktop nav links (.nav-link)
    Hamburger button (#nav-toggle)
    Mobile dropdown (#mobile-menu)
  </nav>
  <main>
    Page-specific content sections
  </main>
  <footer>
    Copyright + footer nav links
  </footer>
  js/config.js    ← always first
  js/nav.js       ← always second
  js/[page].js    ← page-specific last
</body>
```

**Script load order is strict:**
`config.js` must always load first because it defines `nnnFetch()`.
All other scripts depend on that function existing before they run.
`countdown.js` must load before `events.js` because `events.js` calls
`startCountdown()` which is defined in `countdown.js`.

---

### assets/nice-logo.png
Your NICE wordmark already placed here from the uploaded file.
The CSS rule `filter: invert(1)` on `.nav-logo-img` renders it white
on the dark background. You don't need to create a white version yourself.

### assets/og-cover.jpg (YOU NEED TO ADD THIS)
This is the image shown when someone shares your link on WhatsApp,
Instagram DMs, or Twitter. Without it, previews will be blank or ugly.

How to create it:
1. Open your NICE_PS.psd in Photoshop
2. Set canvas size to exactly **1200 × 630 pixels**
3. Background: `#080808` (your site background colour)
4. Place your NICE mark centred, in white
5. **File → Export → Export As → JPEG, quality 85**
6. Save as `og-cover.jpg`
7. Place it in the `assets/` folder

---

## PHASE 4 — Push to GitHub via Visual Studio

### Step 7 — Initialise your Git repository

1. In Visual Studio, go to the top menu: **Git → Create Git Repository**
2. A dialog opens — sign in with your GitHub account if prompted
3. Fill in:
   - **Repository name:** `nnn-platform`
   - **Visibility:** Public (required for free Vercel deployments)
4. Click **Create and Push**

Visual Studio creates the repository on GitHub and pushes all your files.
You can verify by going to `https://github.com/YOUR_USERNAME/nnn-platform`
and confirming all files are there.

### Step 8 — Every future update

After any change to any file:
1. Save the file (`Ctrl+S`)
2. In Visual Studio: **Git → Commit All**
3. Write a short description of what you changed (e.g., "Add new event to calendar")
4. Click **Push**

Vercel detects the push and automatically redeploys in approximately 20 seconds.

---

## PHASE 5 — Deploy on Vercel

### Step 9 — Import the project

1. Go to https://vercel.com and sign in (you're already connected to GitHub)
2. Click **Add New Project**
3. Find `nnn-platform` in the repository list
4. Click **Import**
5. Leave every setting exactly as default — do not set a framework preset,
   do not set a build command, do not set an output directory
6. Do not click Deploy yet — do Step 10 first

### Step 10 — Add your Supabase credentials as environment variables

Still on the Vercel import screen, scroll down to **Environment Variables**.

Add these two variables:

| Name | Value |
|---|---|
| `SUPABASE_URL` | Your Project URL from Step 5 |
| `SUPABASE_ANON_KEY` | Your anon key from Step 5 |

For each variable:
1. Type the name in the Name field
2. Paste the value in the Value field
3. Leave Environment set to **Production, Preview, Development** (all three)
4. Click **Add**

After adding both, click **Deploy**.

Your site goes live in approximately 30 seconds.
Vercel gives you a URL like `https://nnn-platform.vercel.app`.

**Why this is secure:**
Your Supabase URL and key are stored encrypted in Vercel's servers.
They are injected into the serverless function at runtime.
They appear nowhere in your codebase or your GitHub repository.
If you open the browser network tab and inspect requests, you will only
see calls to `/api/supabase` — never to Supabase directly.

### Step 11 — Enable Vercel Analytics

1. In your Vercel project dashboard: click the **Analytics** tab
2. Click **Enable**
3. Done — data flows immediately

The `<script defer src="/_vercel/insights/script.js"></script>` tag
is already present in every HTML file. No code changes needed.

You will see pageview data within 24 hours of your first real visitor.

---

## PHASE 6 — Add Your Custom Domain (When Confirmed)

When your domain `nevernotnice.co.za` is confirmed with your team:

### Step 12 — Add domain to Vercel

1. Vercel dashboard → your project → **Settings → Domains**
2. Type `nevernotnice.co.za` and click **Add**
3. Also add `www.nevernotnice.co.za` and click **Add**
4. Vercel shows you the DNS records to add

### Step 13 — Add DNS records at your registrar

At wherever your domain is registered (Afrihost, Domains.co.za, etc.):

| Type | Name | Value |
|---|---|---|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

### Step 14 — Add Pixieset subdomain

At the same registrar, add:

| Type | Name | Value |
|---|---|---|
| CNAME | gallery | (the CNAME Pixieset gives you in their custom domain settings) |

DNS propagation takes between 15 minutes and 48 hours.
Once live, `nevernotnice.co.za` shows your site and
`gallery.nevernotnice.co.za` routes to Pixieset.

### Step 15 — Update sitemap.xml and robots.txt

Once the domain is confirmed, open these two files in Visual Studio
and replace `nevernotnice.co.za` with your confirmed domain if it changes.
Save → commit → push.

---

## PHASE 7 — Admin Operations Reference

This is your permanent reference for managing all content without touching code.

Go to: https://supabase.com → your `nnn-platform` project → **Table Editor**

---

### Managing Hero Content

**Table:** `global_settings`

| What you want to change | Column to edit |
|---|---|
| Main headline on home page | `hero_headline` |
| Text on the CTA button | `hero_cta_text` |
| Where the CTA button links to | `hero_cta_target_page` |
| Company email shown across the site | `company_email` |

How to edit: Click the row → click the cell → type your change → press **Enter** → click **Save**.

---

### Managing Events

**Table:** `events_calendar`

**Adding a new event:**
1. Click **Insert row**
2. Fill in all fields:
   - `event_name` — the full event name as it will appear on site
   - `event_date` — format exactly: `2025-12-06 19:00:00+02` (SAST timezone)
   - `city` — e.g., `Joburg`
   - `venue` — e.g., `Venue X, Braamfontein` or `TBA`
   - `ticket_status` — must be exactly `Available`, `Upcoming`, or `Sold Out`
   - `ticket_redirect_url` — full URL to your ticketing page, e.g., `https://tickets.nevernotnice.co.za`
3. Click **Save**

The new event appears on the site within 60 seconds.
The countdown clock automatically updates to the soonest available event.

**Marking an event Sold Out:**
1. Find the event row
2. Click the `ticket_status` cell
3. Change to `Sold Out`
4. Press Enter → Save

The button on the website immediately becomes a non-clickable Sold Out badge.

**Deleting a past event:**
1. Select the row (click the checkbox on the left)
2. Click **Delete** at the top
3. Confirm

The row disappears from the live calendar immediately.

**Date format reminder:**
Always use `YYYY-MM-DD HH:MM:SS+02` format.
The `+02` is South Africa Standard Time (SAST).
Example: August 1st 2025 at 8pm = `2025-08-01 20:00:00+02`

---

### Managing Gallery Collections

**Table:** `gallery_archives`

**Adding a new event gallery (after each event):**

Step A — Upload to Pixieset:
1. Log into Pixieset
2. Create a new collection — name it after the event
3. Upload all edited photos
4. Copy the collection URL (it will look like `gallery.nevernotnice.co.za/collection-name`)

Step B — Get a cover image URL:
1. In Pixieset, find the photo you want as the grid card cover
2. Right-click it → **Copy Image Address** (or open it and copy the URL from the address bar)
3. This is your `cover_image_url`

Step C — Insert the row in Supabase:
1. Table Editor → `gallery_archives` → **Insert row**
2. Fill in:
   - `collection_title` — e.g., `Archive Launch Night`
   - `event_city` — e.g., `Joburg`
   - `event_date_text` — e.g., `1 August` (display text, not a date field)
   - `cover_image_url` — paste the Pixieset image URL from Step B
   - `white_label_subdomain_url` — paste the collection URL from Step A
3. Click **Save**

The new gallery card appears on the website gallery page within 60 seconds.

**Removing a gallery collection:**
Select the row → click **Delete** → confirm.

---

### Managing Sub-Brands (IPs)

**Table:** `intellectual_properties`

**Adding a new sub-brand:**
1. Insert row
2. Fill in `ip_name`, `tagline`, `description`, `badge_status`
3. Set `is_active_campaign` to `true` if it should be highlighted

**Updating copy:**
Click any cell → edit → Enter → Save.

---

## PHASE 8 — UI Polish Reference (For When You're Ready)

All visual changes start in `css/globals.css`.
The `:root` block is your control panel. Change values there only.

```css
:root {
  /* COLOURS — change these to retheme the entire site */
  --color-bg:           #080808;    background
  --color-bg-raised:    #0f0f0f;    slightly lifted surfaces
  --color-bg-subtle:    rgba(255,255,255,0.03);   card backgrounds
  --color-border:       rgba(255,255,255,0.08);   dividers and borders
  --color-border-mid:   rgba(255,255,255,0.15);   active card borders
  --color-text-primary: #f0f0f0;    main body text
  --color-text-muted:   #888888;    secondary text
  --color-text-faint:   #444444;    labels, captions, very muted text
  --color-accent:       #ffffff;    CTA buttons and highlights

  /* FONTS — swap these to change typography site-wide */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono:    'Space Mono', monospace;
}
```

| Visual change | What to do |
|---|---|
| Different font | Change `--font-display` value, update Google Fonts import URL |
| Different background | Change `--color-bg` |
| Coloured accent buttons | Change `--color-accent` from `#ffffff` to your colour |
| Remove grain texture | Delete the `body::after { }` block |
| Softer hero headline | In `.hero-wordmark`, change `var(--font-mono)` to `var(--font-display)` |
| Different border softness | Change `--color-border` opacity value |

---

## TROUBLESHOOTING

**Site loads but data never appears — stuck on skeleton loaders**

This version uses a serverless API proxy. It only works when deployed
on Vercel — not when opening HTML files directly from your computer.
Opening `index.html` by double-clicking it (file:// URL) will not work.
You must use the Vercel deployment URL to test live data.

To test locally before deploying: use `vercel dev` command in a terminal
(requires Node.js). But for this project, deploying to Vercel and testing
the live URL is the simpler approach.

---

**Vercel deployment shows "Function not found" for API calls**

Check that `api/supabase.js` was included in your GitHub push.
In Visual Studio, go to **Git → View → Git Repository** and verify
the file appears in the repository.

---

**Environment variables not working after adding them**

After adding environment variables in Vercel, you must trigger a new
deployment for them to take effect.
Go to **Deployments → click your latest deployment → Redeploy**.

---

**Logo appears as a broken image or is invisible**

The logo file must be named exactly `nice-logo.png` and located in
the `assets/` folder. It is already placed correctly in the zip.
If you moved or renamed it, restore it to `assets/nice-logo.png`.

The CSS `filter: invert(1)` makes the black PNG appear white.
If `globals.css` is not loading, the logo will appear black and invisible.
Open browser DevTools (F12) → Console tab to see if there are any
CSS loading errors.

---

**Mobile hamburger menu opens but links don't close it**

This means `js/nav.js` is not loaded on the page.
Check that the script tag `<script src="js/nav.js"></script>` is present
at the bottom of the `<body>` on that page.

---

**Countdown showing wrong time**

Check the `event_date` value in your `events_calendar` table.
It must include the timezone offset: `2025-08-01 20:00:00+02`
Without `+02`, JavaScript treats it as UTC and the countdown is 2 hours off.

---

**Gallery images not loading**

The `cover_image_url` must be a direct HTTPS URL to an image file.
Pixieset image URLs end in `.jpg` or similar.
If you paste a Pixieset gallery page URL instead of a direct image URL,
it will show a broken image. Use right-click → Copy Image Address
on the specific photo in Pixieset.

The `onerror` handler in `gallery.js` shows a graceful fallback
("Image unavailable") if a URL breaks, so the grid never collapses.

---

**WhatsApp share preview showing no image or wrong image**

WhatsApp caches OG images heavily. After placing your `og-cover.jpg`:
1. Go to https://developers.facebook.com/tools/debug
2. Paste your page URL and click **Debug**
3. Click **Scrape Again** — this forces a cache clear for WhatsApp too

---

**Changes in Supabase not showing on the live site**

The serverless function caches responses for 60 seconds on Vercel's CDN.
Wait 60 seconds then hard-refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac).

---

**Vercel Analytics shows no data**

Data takes up to 24 hours to appear after first enabling.
The script tag is already in every HTML file — nothing else to configure.
If after 48 hours there is still no data, check the Analytics tab in Vercel
and confirm it shows as Enabled.

---

## COMPONENT SUMMARY — What Renders What

| Component | Driven by | Editable in |
|---|---|---|
| Hero headline | `global_settings.hero_headline` | Supabase Table Editor |
| Hero CTA button | `global_settings.hero_cta_text` + `hero_cta_target_page` | Supabase Table Editor |
| Company email | `global_settings.company_email` | Supabase Table Editor |
| IP brand cards (Events page) | `intellectual_properties` table | Supabase Table Editor |
| Countdown clock | First non-sold-out `events_calendar` row by date | Supabase Table Editor |
| Events calendar list | All rows in `events_calendar` | Supabase Table Editor |
| Ticket button state | `events_calendar.ticket_status` | Supabase Table Editor |
| Gallery grid | All rows in `gallery_archives` | Supabase Table Editor |
| Gallery outbound link | `gallery_archives.white_label_subdomain_url` | Supabase Table Editor |
| Nav active link | Current page URL (auto-detected by nav.js) | Automatic |
| All colours | `css/globals.css :root` variables | globals.css |
| All fonts | `css/globals.css :root` + Google Fonts import | globals.css |
| All spacing/layout | Tailwind classes in HTML + globals.css | HTML files |
| Security headers | `vercel.json` | vercel.json (rarely) |
| Search engine access | `robots.txt` + `sitemap.xml` | Those files |
| Social share image | `assets/og-cover.jpg` + OG tags in each HTML `<head>` | Replace the image |
| 404 page | `404.html` | That file directly |
