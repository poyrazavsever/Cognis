# Neta Landing Page Design Brief

## Design read

Neta, bağımsız çalışanların dağınık iş akışlarını kendi kontrolünde tutan ciddi bir çalışma ürünüdür. Site teknik güven vermeli, ancak maskot sayesinde soğuk ve kurumsal hissettirmemelidir.

## Concept spine

**Düz simgeden çalışan sisteme.** Neta kuşu tek bir kesintisiz uçuşta uyanır, dağınık işi toplar, müşteriye görünürlük kazandırır, veriyi anlamlandırır ve kullanıcının kendi sunucusuna konar.

## Delivery

- Delivery tier: cinema
Animation mode: animated-website
- Journey shape: single-shot
- Tier-1 technique: A4 scroll-controlled single-shot film
- Runtime: pre-rendered 3D film, no WebGL in the first release
- Product UI: only real Neta screenshots rendered in HTML sections

## Visual system

- Theme paradigm: Pristine Light throughout, including the cinematic film stage
- Background character: cool porcelain surfaces, restrained technical grid and soft ambient depth
- Typography character: Outfit for display and body, IBM Plex Mono for commands and technical labels
- Hero architecture: full-viewport image-first cinema with restrained HTML copy
- Section system: Swiss grid discipline with asymmetric proof compositions
- Narrative spine: journey and waypoints
- Signature components: product UI panel stack, gapless bento, layered image crop frames, vertical rhythm lines
- Second-read moment: one oversized red wing-shaped crop behind the module grid
- Corner language: 8px radius for product surfaces, square hairlines for technical elements, pills only for true controls

## Locked palette

- Neta red: `#E5222A`
- Ink: `#15181B`
- Film ground: `#F3F5F7`
- Porcelain: `#F3F5F7`
- White: `#FFFFFF`
- Muted ink: `#626A73`
- Hairline: `#D8DDE3`

Neta red is the only accent. The neutral family is deliberately cool so the existing red-and-white mascot remains the dominant brand signal without turning the page into a one-note red theme.

## Character grammar

- Preserve the exact bird silhouette, wing count, beak direction and red-white identity from `public/logo/iconLogo.png`.
- Convert it into a soft premium 3D character with matte porcelain-white edges, Neta-red feather planes and tiny charcoal facial details.
- Keep the expression alert and warm, not childish. Avoid clothes, human anatomy, mascot costumes and unrelated accessories.
- One character only. Role changes are communicated through action and nearby objects, not by redesigning the bird.
- Film lighting is a soft upper-left key with a controlled red rim on a light porcelain set. Exposure, white balance, lens and material finish stay locked throughout.

## Journey

Camera architecture: A, one continuous forward flight. The single-shot film has no clip seams.

Seam direction: forward from an abstract logo state toward a grounded server state. Reverse scroll must read as an intentional rewind of the same journey.

World grammar: premium tactile 3D animation, 35mm equivalent lens, centered bird, cool light-porcelain studio world, soft gray depth, Neta-red signals, upper-left key light, minimal motion blur, fixed exposure, clean negative space, no text, no letters, no generated logos, no screens, no watermarks. The opening frame uses the exact user-owned `iconLogo.png` pixels on the light set.

1. **Neta uyanıyor**: A flat red-and-white bird symbol floats at the center and softly gains volume, depth and a living expression. Headline and install command are HTML.
2. **Dağınık işler düzene giriyor**: The bird advances while task cards, calendar tiles and project blocks orbit once and settle into a precise workspace behind it.
3. **Müşteri projeleri görünür oluyor**: The bird carries one small red revision note through a clean portal-shaped frame; progress blocks align around the path.
4. **AI veriyi anlamlandırıyor**: Task, finance and daily-performance tokens converge as restrained streams around the bird and resolve into one calm luminous core.
5. **Kontrol sende kalıyor**: The camera approaches a compact server unit. The bird lands on top, folds its wings and holds the final beauty pose.

The journey enacts the concept spine by physically turning one flat mark into an organized, self-hosted operating system.

## Storyboard and footage contract

- Storyboard: one 16:9 six-panel sheet showing six moments of the same unbroken move, not six unrelated scenes.
- Film: Seedance 2.0, 16:9, longest supported single take near 15 seconds, highest practical quality.
- Motion: slow and steady with gentle easing only at the ends. No cuts, shake, whip pans, flicker, exposure shifts or heavy blur.
- Composition: bird and critical objects remain in the center-safe 44 percent of the frame.
- Background: low-detail light porcelain with controlled gray contrast for dark HTML copy; no generated interface or embedded typography.
- Desktop budget: maximum 32 MiB total.
- Mobile budget: maximum 16 MiB total, 720px high encode with tighter keyframes.
- Reduced motion: no film request or decode. Show static posters and all five semantic chapters.

## Section plan

1. Scroll journey: sticky full-viewport film with five semantic chapters, 430 to 500 viewport-heights total.
2. Product proof: asymmetric dashboard stack with one dominant real screenshot and a horizontal module index.
3. Modules: controlled gapless bento with seven real product areas and no repeated equal-card row.
4. Client portal: dashboard-centered three-screen composition with a compact text rail.
5. AI assistant: real image on the left, concise copy and two capability rows on the right.
6. Self-host final: full-width technical band, compact server diagram, GitHub route and copyable install command.
7. Footer: unframed single-line brand, documentation, language and maker links.

Mobile collapse: the film keeps center-safe framing; proof stacks become a swipeable two-card rail; bento becomes one large cell followed by paired cells; portal screens become a controlled tab switcher; AI and self-host become single-column flows.

Eyebrow budget: maximum two across the six content sections. The hero uses one; the self-host final may use the second.

## Asset plan

- User-owned logo and long wordmarks remain authoritative.
- One logo-referenced premium 3D character exploration sheet.
- One six-frame continuous-move storyboard.
- One Seedance 2.0 source film, then desktop/mobile scrub encodes and exact first-frame posters.
- One wide Neta social image derived from the approved character/world language.
- Existing product screenshots remain untouched and are framed by HTML/CSS.
- Existing icon library remains limited to dense functional UI; the mascot and generated film carry the bespoke visual identity.

## CTA inventory

- Hero demo: solid red command block with a small directional icon and tactile press state.
- Hero install: mono command field with a dedicated copy control and copied confirmation.
- Product proof: full-width route row whose arrow travels horizontally on hover.
- Self-host GitHub: corner-bracket target that closes around the label on hover.
- Documentation: plain text route with a moving red baseline.
- Nav demo: compact square-edged command, visually distinct from the hero CTA.

## Content principle

The film tells the story. Real screenshots prove the product. Generated imagery never impersonates the Neta interface.
