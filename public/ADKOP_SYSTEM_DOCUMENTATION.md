# ADKOP – System Documentation for AI Agents
**Version:** 1.0 | **Last Updated:** 2026-02-16 | **Language:** Hebrew-first advertising platform

---

## 📋 System Overview

ADKOP is a **smart advertising platform for the Haredi (Ultra-Orthodox Jewish) market in Israel**.  
It handles the full campaign lifecycle: client onboarding → brand identity → creative generation → media buying → proof management.

**Tech Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase (DB, Auth, Edge Functions, Storage)

---

## 🗺️ Application Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Index | Landing page |
| `/auth` | Auth | User login/signup (email+password) |
| `/onboarding` | OnboardingWizard | Multi-step client brand onboarding |
| `/dashboard` | Dashboard | Main client dashboard (campaigns, proofs, metrics) |
| `/studio` | CreativeStudio | AI-powered ad creative generator |
| `/internal-studio` | InternalStudio | Internal agency studio (admin) |
| `/brain` | SectorBrain | AI knowledge base for Haredi advertising rules |
| `/profile` | ClientProfile | Client brand profile editor |
| `/new-campaign` | FastTrackWizard | Quick campaign creation wizard |
| `/clients` | AgencyClients | Agency multi-client management |
| `/admin-auth` | AdminAuth | Admin login |
| `/admin-dashboard` | AdminDashboard | Admin panel (media DB, AI configs, proofs, orders) |
| `/media-portal` | MediaPortal | External media outlet portal (token-based access) |
| `/adkop` | AdkopWizard | Full ADKOP campaign wizard (MRI → Creative → Media) |
| `/media-export` | MediaExport | Export media catalog to Excel/CSV |

---

## 🗄️ Database Schema

### Core Tables

#### `profiles`
User profile (auto-created on signup via trigger).
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | uuid (PK) | ✅ | = auth.users.id |
| email | text | - | User email |
| full_name | text | - | Full name |
| company_name | text | - | Company name |
| phone | text | - | Phone number |

#### `client_profiles`
The main brand identity record. One per business.
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid (PK) | ✅ | gen_random_uuid() | |
| user_id | uuid | ✅ | | Owner user |
| business_name | text | ✅ | | Business name (Hebrew) |
| logo_url | text | - | | URL to logo in storage |
| website_url | text | - | | Business website |
| primary_color | text | - | #E31E24 | Brand primary color (hex) |
| secondary_color | text | - | #000000 | Brand secondary color (hex) |
| background_color | text | - | #FFFFFF | Brand background color (hex) |
| header_font | text | - | Assistant | Header font family |
| body_font | text | - | Heebo | Body font family |
| x_factors | text[] | - | {} | Differentiating factors |
| primary_x_factor | text | - | | Main differentiator |
| advantage_type | text | - | | "hard" (product) or "soft" (brand) |
| advantage_slider | int | - | 50 | Price-quality position (0-100) |
| winning_feature | text | - | | Key selling point |
| competitors | text[] | - | {} | Competitor names |
| my_position_x | int | - | 0 | Positioning map X (-100 to 100) |
| my_position_y | int | - | 0 | Positioning map Y (-100 to 100) |
| competitor_positions | jsonb | - | [] | Array of {name, x, y} |
| target_audience | text | - | | Target audience description |
| end_consumer | text | - | | End consumer description |
| decision_maker | text | - | | Purchase decision maker |
| contact_phone | text | - | | |
| contact_whatsapp | text | - | | |
| contact_email | text | - | | |
| contact_address | text | - | | |
| social_facebook | text | - | | |
| social_instagram | text | - | | |
| social_tiktok | text | - | | |
| social_linkedin | text | - | | |
| contact_youtube | text | - | | |
| personal_red_lines | text[] | - | {} | Content restrictions |
| successful_campaigns | text[] | - | {} | Past successful campaigns |
| past_materials | jsonb | - | [] | Uploaded past ad materials |
| honorific_preference | text | - | neutral | How to address client |
| onboarding_completed | bool | - | false | Onboarding finished? |
| is_agency_profile | bool | - | false | Created by agency? |
| agency_owner_id | uuid | - | | Agency user who owns this |

#### `campaigns`
A marketing campaign created by a client.
| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid (PK) | ✅ | gen_random_uuid() | |
| user_id | uuid | ✅ | | Owner user |
| client_profile_id | uuid (FK) | ✅ | | Links to client_profiles |
| name | text | ✅ | | Campaign name (up to ~100 chars) |
| goal | text | - | | "awareness" / "promotion" / "launch" / "seasonal" |
| vibe | text | - | | Visual mood/style |
| budget | numeric | - | | Total budget (ILS) |
| status | text | - | "draft" | "draft" / "active" / "completed" |
| start_date | date | - | | |
| end_date | date | - | | |
| target_stream | text | - | | "hasidic" / "litvish" / "general" / "sephardic" |
| target_gender | text | - | | "men" / "women" / "all" |
| target_city | text | - | | Target city |
| selected_media | jsonb | - | [] | Selected media outlets/products |
| creatives | jsonb | - | [] | Generated creative concepts |

#### `user_roles`
Role-based access control.
| Column | Type | Description |
|--------|------|-------------|
| user_id | uuid | |
| role | enum | "admin" or "user" |

---

### Media System Tables

#### `media_categories`
Top-level media categories (e.g., "עיתונות", "שילוט", "דיגיטל").
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| name | text | English name |
| name_he | text | Hebrew name |
| sort_order | int | Display order |

#### `media_outlets`
Specific media outlets (e.g., "יתד נאמן", "המודיע").
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| category_id | uuid (FK→media_categories) | |
| name | text | English name |
| name_he | text | Hebrew name |
| sector | text | "haredi" / "dati-leumi" etc. |
| stream | text | "hasidic" / "litvish" / "general" / "sephardic" |
| city | text | Geographic coverage |
| vibe / vibe_he | text | Outlet style/tone |
| reach_info | text | Audience reach description |
| warning_text | text | Content restrictions/warnings |
| logo_url | text | Outlet logo |
| brand_color | text | Outlet brand color (hex, default #E31E24) |
| is_active | bool | |

#### `media_products`
Products offered by each outlet (e.g., "מודעת רבע עמוד", "ספונסר").
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| outlet_id | uuid (FK→media_outlets) | |
| name / name_he | text | Product name |
| product_type | text | "ad" / "insert" / "sponsored" / "banner" etc. |
| base_price | numeric | Cost price |
| client_price | numeric | Selling price |
| target_audience | text | |
| gender_target | text | "men" / "women" / "all" |
| special_tag | text | e.g., "premium", "new" |
| requires_image | bool | Needs image creative? |
| requires_text | bool | Needs text copy? |

#### `product_specs`
Size/format specs for each product (e.g., "20x30 ס״מ", "עמוד שלם").
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| product_id | uuid (FK→media_products) | |
| name / name_he | text | Spec name |
| dimensions | text | e.g., "20x30cm", "1920x1080px" |
| base_price | numeric | |
| client_price | numeric | |
| allowed_content | text[] | What content types are allowed |

#### `media_orders`
Orders placed for specific media placements.
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | |
| campaign_id | uuid (FK→campaigns) | |
| outlet_id | uuid (FK→media_outlets) | |
| product_id | uuid (FK→media_products) | |
| spec_id | uuid (FK→product_specs) | |
| client_price | numeric | |
| status | text | "pending" / "confirmed" / "published" / "cancelled" |
| publication_date | date | |
| deadline_date | date | |
| creative_url | text | Link to creative file |
| order_notes | text | Internal notes |
| media_notes | text | Notes from media outlet |

#### `media_portal_access`
Token-based access for media outlets to view/manage their orders.
| Column | Type | Description |
|--------|------|-------------|
| outlet_id | uuid (FK→media_outlets) | |
| access_token | text | Auto-generated 64-char hex token |
| contact_name / contact_email / contact_phone | text | Outlet contact info |
| is_active | bool | |

#### `campaign_media_proofs`
Proof of publication (clippings, screenshots).
| Column | Type | Description |
|--------|------|-------------|
| campaign_id | uuid (FK→campaigns) | |
| order_id | uuid (FK→media_orders) | |
| media_outlet_name | text | |
| proof_type | text | "clipping" / "screenshot" / "photo" |
| image_url | text | URL to proof image |
| publication_date | date | |
| admin_status | text | "pending" / "approved" / "rejected" |
| admin_notes | text | |

---

### AI & Knowledge Base Tables

#### `ai_model_configs`
Per-media-type AI generation configurations.
| Column | Type | Description |
|--------|------|-------------|
| media_type | text | "print_ads" / "banners" / "signage" / "promo" |
| model_name | text | AI model identifier |
| display_name | text | Hebrew display name |
| system_prompt | text | Base system prompt for this media type |
| design_rules | text[] | Design guidelines |
| text_rules | text[] | Text/copy rules |
| logo_instructions | text | How to handle logos |
| color_usage_rules | text | Color palette instructions |
| typography_rules | text | Font/type rules |
| layout_principles | text[] | Layout guidelines |
| dos | text[] | Best practices |
| donts | text[] | Things to avoid |

#### `prompt_templates`
Reusable prompt templates for AI generation.
| Column | Type | Description |
|--------|------|-------------|
| name | text | Template name |
| category | text | Template category |
| system_prompt | text | The prompt template |
| dynamic_variables | text[] | Variables like {business_name}, {offer} |
| style_preset | text | Associated style |

#### `sector_brain_examples`
Knowledge base of advertising examples, guidelines, and red lines for the Haredi sector.
| Column | Type | Description |
|--------|------|-------------|
| zone | text | "fame" (good examples), "redlines" (bad), "styles" |
| name | text | Example name |
| file_path | text | Path in sector-brain storage bucket |
| file_type | text | MIME type (image/*, text, etc.) |
| text_content | text | Text content of the example |
| description | text | Description/explanation |
| is_general_guideline | bool | Is this a general rule? |
| example_type | text | "good" / "bad" |
| media_type | text | "ads" / "text" / "video" / "signage" / "promo" / "radio" |
| stream_type | text | "hasidic" / "litvish" / "general" / "sephardic" |
| gender_audience | text | Target gender |
| topic_category | text | e.g., "real_estate", "food", "electronics" |
| holiday_season | text | e.g., "pesach", "rosh_hashana", "year_round" |

#### `sector_brain_links`
External links for AI knowledge enrichment.
| Column | Type | Description |
|--------|------|-------------|
| url | text | External URL |
| media_type | text | Associated media type |

#### `ai_generation_logs`
Log of every AI generation for learning and analytics.
| Column | Type | Description |
|--------|------|-------------|
| generation_type | text | "image" / "concepts" / "text" |
| media_type | text | |
| prompt_used | text | Full prompt sent to AI |
| generated_output | text | Result (URL or text) |
| success | bool | |
| user_feedback | text | User rating |
| brand_context | jsonb | Brand data used |
| campaign_context | jsonb | Campaign data used |
| model_config_id | uuid (FK→ai_model_configs) | |
| client_profile_id | uuid (FK→client_profiles) | |

#### `generated_images`
Gallery of all generated images.
| Column | Type | Description |
|--------|------|-------------|
| visual_prompt | text | The visual description prompt |
| text_prompt | text | Hebrew text to embed in image |
| style | text | Visual style used |
| engine | text | AI engine used |
| image_url | text | Generated image URL |
| kosher_status | text | "pending" / "approved" / "needs-review" / "rejected" |
| kosher_analysis | text | AI modesty check results |

#### `branding_orders`
Orders for professional branding services.
| Column | Type | Description |
|--------|------|-------------|
| user_id | uuid | |
| essence / differentiator / persona / audience / vision | text | Brand strategy fields |
| design_preferences | text | |
| package_type | text | |
| package_price | numeric | |
| status | text | "pending" / "in_progress" / "completed" |
| payment_status | text | "unpaid" / "paid" |

---

## 🔌 API – Edge Functions

Base URL: `https://mxesxznzxlgthcafomdl.supabase.co/functions/v1/`

All functions require `Authorization: Bearer <anon_key>` header.  
All return JSON. All support CORS preflight (OPTIONS).

---

### 1. `POST /predict-business`
Predicts business details from name + optional website URL.

**Request:**
```json
{
  "brandName": "חלקת מחוקק",     // required, string
  "websiteUrl": "https://..."     // optional, string
}
```

**Response:**
```json
{
  "predictions": {
    "industry": "ריהוט לבית ולמשרד",
    "audience": "משפחות חרדיות",
    "coreOffering": "ריהוט איכותי במחירים נוחים",
    "seniority": "עסק ותיק"
  }
}
```

---

### 2. `POST /extract-logo-colors`
Extracts brand colors from a logo image.

**Request:**
```json
{
  "imageUrl": "https://...",      // one of these required
  "imageBase64": "data:image/..."  // or raw base64 string
}
```

**Response:**
```json
{
  "colors": {
    "primary": "#FF5733",
    "secondary": "#004E89",
    "background": "#FFFFFF"
  }
}
```

---

### 3. `POST /validate-brand-passport`
Validates brand identity data for logical inconsistencies.

**Request:**
```json
{
  "businessName": "string",
  "industry": "string",
  "seniority": "string",
  "audience": "string",
  "coreOffering": "string",
  "xFactors": ["string"],
  "primaryXFactor": "string | null",
  "otherXFactor": "string",
  "advantageType": "hard | soft | null",
  "pricePosition": -100 to 100,
  "stylePosition": -100 to 100,
  "competitors": ["string"],
  "noCompetitors": false,
  "endConsumer": "string",
  "decisionMaker": "string"
}
```

**Response:**
```json
{
  "issues": [
    {
      "type": "warning | suggestion",
      "category": "inconsistency | sparse_data | improvement",
      "message": "Hebrew explanation (≤50 words)",
      "field": "optional field name"
    }
  ]
}
```

---

### 4. `POST /generate-concepts`
Generates 3 creative advertising concepts for a campaign.

**Request:**
```json
{
  "profile": {
    "business_name": "string",
    "target_audience": "string",
    "primary_x_factor": "string",
    "winning_feature": "string",
    "advantage_type": "string",
    "x_factors": ["string"]
  },
  "mediaType": "ad | radio | banner | billboard | social | all",
  "campaignBrief": {
    "title": "string",
    "offer": "string (main message – CRITICAL)",
    "goal": "promotion | awareness | launch | seasonal"
  },
  "holidaySeason": "pesach | rosh_hashana | year_round | ..."
}
```

**Response:**
```json
{
  "concepts": [
    {
      "id": "emotional-1708123456-0",
      "type": "emotional | hard-sale | pain-point",
      "headline": "כותרת הזווית",
      "idea": "תיאור הויזואל/ספוט",
      "copy": "הקופי בעברית",
      "mediaType": "ad"
    }
  ]
}
```

---

### 5. `POST /generate-creative`
Generates an advertising IMAGE using AI + Sector Brain knowledge.

**Request:**
```json
{
  "prompt": "string (visual description)",       // required
  "style": "ultra-realistic | 3d-character | oil-painting | flat-design | ...",
  "aspectRatio": "square | portrait | landscape",
  "topicCategory": "real_estate | food | ...",
  "streamType": "hasidic | litvish | ...",
  "genderAudience": "men | women | all",
  "brandContext": {
    "businessName": "string",
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "targetAudience": "string",
    "xFactors": ["string"]
  },
  "campaignContext": {
    "goal": "string",
    "vibe": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "targetStream": "string",
    "targetGender": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,...",
  "prompt": "enhanced prompt used",
  "style": "ultra-realistic",
  "sectorExamplesUsed": 15,
  "holidayExamplesUsed": 3,
  "relevantHolidays": ["pesach", "year_round"]
}
```

---

### 6. `POST /generate-image`
Full-featured image generation with template support + model configs.

**Request:**
```json
{
  "visualPrompt": "string",
  "textPrompt": "Hebrew text to embed (optional)",
  "style": "ultra-realistic | 3d-character | ...",
  "engine": "nano-banana | flux",
  "templateId": "newspaper-full | banner-leaderboard | billboard-standard | social-square | ...",
  "templateHints": "additional instructions",
  "dimensions": { "width": 1080, "height": 1920 },
  "mediaType": "print_ads | banners | signage | promo",
  "brandContext": {
    "businessName": "string",
    "colors": { "primary": "#hex", "secondary": "#hex", "background": "#hex" },
    "targetAudience": "string",
    "primaryXFactor": "string",
    "winningFeature": "string",
    "xFactors": ["string"],
    "logoUrl": "string",
    "fonts": { "header": "string" }
  },
  "campaignContext": {
    "title": "string",
    "offer": "string (main message)",
    "goal": "awareness | promotion | launch | seasonal",
    "vibe": "string",
    "targetStream": "string",
    "targetGender": "string"
  }
}
```

**Response:**
```json
{
  "imageUrl": "data:image/png;base64,...",
  "status": "approved",
  "message": "AI text response if any",
  "model": "google/gemini-3-pro-image-preview",
  "configUsed": "print_ads"
}
```

**Template IDs:**
- Print: `newspaper-full`, `newspaper-half`, `newspaper-quarter`
- Digital: `banner-leaderboard`, `banner-rectangle`, `banner-skyscraper`
- Outdoor: `billboard-standard`, `billboard-digital`
- Social: `social-square`, `social-story`

**Styles:**
`ultra-realistic`, `3d-character`, `oil-painting`, `flat-design`, `watercolor`, `vintage-retro`, `luxury-minimal`, `bold-graphic`

---

### 7. `POST /kosher-check`
AI modesty/cultural check on a generated image.

**Request:**
```json
{
  "imageUrl": "https://... or data:image/..."
}
```

**Response:**
```json
{
  "status": "approved | needs-review | rejected",
  "confidence": 0-100,
  "issues": ["specific issue descriptions"],
  "recommendation": "Hebrew recommendation text"
}
```

---

### 8. `POST /ai-chat`
Streaming AI chat assistant for advertising help.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "כתוב לי סלוגן למאפייה" }
  ],
  "context": {
    "business_name": "...",
    "target_audience": "..."
  }
}
```

**Response:** SSE stream (text/event-stream) with OpenAI-compatible chunks.

---

### 9. `POST /scrape-website`
Scrapes a website using Firecrawl API.

**Request:**
```json
{
  "url": "https://example.com",
  "options": {
    "formats": ["markdown", "branding"],
    "onlyMainContent": true,
    "waitFor": 2000
  }
}
```

**Response:** Firecrawl API response (markdown, branding data, etc.)

---

### 10. `GET /sector-brain-api`
Fetch sector brain examples with filters.

**Query Parameters:**
- `media_type`: ads | text | video | signage | promo | radio
- `example_type`: good | bad
- `stream_type`: hasidic | litvish | general | sephardic
- `gender_audience`: men | women | all
- `topic_category`: real_estate | food | electronics | ...
- `holiday_season`: pesach | rosh_hashana | chanukah | ...
- `guidelines_only`: true/false
- `include_guidelines`: true/false (default true)
- `limit`: number (default 100)

**Response:**
```json
{
  "success": true,
  "guidelines": [{ "id": "...", "text": "...", "created_at": "..." }],
  "count": 42,
  "examples": [
    {
      "id": "uuid",
      "name": "example name",
      "type": "image | text | document",
      "example_type": "good | bad",
      "media_type": "ads",
      "stream_type": "hasidic",
      "text_content": "...",
      "image_url": "https://...",
      "topic_category": "food",
      "holiday_season": "pesach"
    }
  ]
}
```

---

### 11. `POST /analyze-brain-content`
AI analysis of sector brain knowledge base (streaming).

**Request:**
```json
{
  "insightType": "general | media_ads | media_radio | stream_hasidic | holiday_pesach | topic_food"
}
```

**Response:** SSE stream with Markdown-formatted insights.

---

## 📦 Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `brand-assets` | ✅ | Client logos, brand materials |
| `sector-brain` | ✅ | Advertising examples, guidelines, images |
| `media-logos` | ✅ | Media outlet logos |
| `campaign-proofs` | ✅ | Publication proof images |

---

## 🔐 Authentication & Authorization

- **Auth Method:** Email + Password (Supabase Auth)
- **Roles:** `admin` / `user` (stored in `user_roles` table)
- **Role Check:** `has_role(auth.uid(), 'admin')` SQL function
- **RLS:** All tables have Row Level Security enabled
  - Users see only their own data
  - Admins see everything
  - Some tables (media_outlets, media_products, etc.) are publicly readable

---

## 🔄 Main Flows

### Flow 1: Client Onboarding
```
Auth → OnboardingWizard:
  1. Welcome (StepWelcome)
  2. Business name → predict-business API
  3. Website URL → scrape-website → extract-logo-colors
  4. Brand Passport (X-factors, positioning, competitors)
  5. validate-brand-passport API
  6. Strategy summary
  7. Contact details
  8. Past materials upload
  → Creates client_profiles record → Dashboard
```

### Flow 2: Campaign Creation
```
Dashboard → FastTrackWizard (or AdkopWizard):
  1. Campaign name, goal, dates
  2. Budget & audience targeting (stream, gender, city)
  3. Media selection from media_outlets → media_products → product_specs
  4. generate-concepts API → 3 creative concepts
  5. Select concept → generate-image API → image generation
  6. kosher-check API → modesty validation
  7. Final review
  → Creates campaigns record + media_orders
```

### Flow 3: Creative Studio
```
Dashboard → CreativeStudio:
  1. Select media type (print/banner/billboard/social)
  2. Write brief or select template
  3. Choose style (ultra-realistic, 3D, etc.)
  4. generate-image API with brand+campaign context
  5. kosher-check API
  6. Edit in canvas editor (fabric.js)
  7. Download/export
```

### Flow 4: Media Portal (External)
```
Media outlet receives link with token:
  /media-portal?token=<64-char-hex>
  → Sees their orders
  → Can update order status
  → Can upload publication proofs
```

### Flow 5: Sector Brain (Admin)
```
Admin uploads examples → sector_brain_examples table
  - Good/bad examples with images
  - Guidelines and red lines
  - Categorized by media type, stream, holiday, topic
  → analyze-brain-content API generates insights
  → Knowledge feeds into generate-creative & generate-image
```

---

## 🏷️ Enums & Constants

### Campaign Goals
`awareness` | `promotion` | `launch` | `seasonal`

### Stream Types (Religious streams)
`hasidic` | `litvish` | `general` | `sephardic`

### Media Types (for AI configs)
`print_ads` | `banners` | `signage` | `promo`

### Sector Brain Media Types
`ads` | `text` | `video` | `signage` | `promo` | `radio`

### Holiday/Season Options
`pesach` | `sukkot` | `chanukah` | `purim` | `shavuot` | `lag_baomer` | `tu_bishvat` | `summer` | `bein_hazmanim` | `rosh_hashana` | `yom_kippur` | `year_round`

### Topic Categories
`real_estate` | `beauty` | `food` | `cellular` | `filtered_internet` | `electronics` | `hotels` | `mens_fashion` | `kids_fashion` | `womens_fashion` | `makeup` | `education` | `health` | `finance` | `events` | `judaica` | `toys` | `furniture` | `jewelry` | `other`

### Conservatism Level (ADKOP Wizard, 1-10)
1=דתי/מודרני כללי → 10=חסידי קיצוני/מסורתי

### Target Emotions (ADKOP)
`security` (ביטחון) | `joy` (שמחה) | `prestige` (יוקרה) | `belonging` (שייכות)

---

## ⚠️ Critical Business Rules

1. **NO WOMEN IN IMAGES** – The most critical rule. AI-generated images must never show women or girls.
2. **Full modesty** – All content must be modest and appropriate for religious publications.
3. **Hebrew only** – All ad text must be in Hebrew (right-to-left).
4. **Kosher check** – Every generated image goes through `kosher-check` AI validation.
5. **Stream sensitivity** – Content must be appropriate for the target religious stream (Hasidic vs Litvish have different norms).
6. **Red lines** – Each client can define personal content restrictions (`personal_red_lines`).
7. **Holiday context** – AI automatically adapts content based on campaign dates and Jewish calendar.

---

## 🔗 External Dependencies

| Service | Purpose | Secret Key |
|---------|---------|------------|
| Lovable AI Gateway | AI text & image generation | LOVABLE_API_KEY |
| Firecrawl | Website scraping | FIRECRAWL_API_KEY |

**AI Models Used:**
- `google/gemini-2.5-flash` – Text generation (concepts, chat, analysis)
- `google/gemini-2.5-pro` – Vision analysis (color extraction)
- `google/gemini-3-pro-image-preview` – Image generation with Hebrew text
- `google/gemini-3-flash-preview` – Fast validation
- `google/gemini-2.5-flash-image` – Fast image generation (no text)
