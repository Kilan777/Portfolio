    # Design Guide - Craflow-Inspired Aesthetic

    ## Overview
    Your website uses a bold, modern design inspired by Craflow's minimalist approach. Here's what makes it special:

    ## Key Design Elements

    ### 1. Typography
    - **Hero Heading**: 7rem (huge!) with tight letter-spacing (-0.03em)
    - **Section Titles**: 4rem, bold weight (700)
    - **Body Text**: 1.1rem with comfortable line-height (1.7)
    - **Font**: System font stack for fast loading and native feel

    ### 2. Color Palette
    ```
    Primary Background:   #0a0a0a (almost black)
    Secondary Background: #141414 (slightly lighter black)
    Text Primary:         #ffffff (white)
    Text Secondary:       #a0a0a0 (gray)
    Accent:              #6366f1 (indigo)
    Accent Light:        #818cf8 (light indigo)
    ```

    ### 3. Layout Principles

    **Hero Section:**
    - Full viewport height
    - Large badge at top (PIE Project 2025)
    - Massive title with gradient text effect
    - 4-column stats grid at bottom

    **Content Sections:**
    - Alternating backgrounds (dark and slightly darker)
    - 8rem padding top/bottom
    - Max-width: 1400px container
    - Generous whitespace between elements

    **Cards:**
    - Subtle background: rgba(255, 255, 255, 0.02)
    - 1px border with low opacity
    - 12-20px border radius
    - Hover effects: translateY(-5px) or translateX(10px)

    ### 4. Interactive Elements

    **Navigation:**
    - Fixed to top
    - Glassmorphism (backdrop-filter: blur)
    - Links change color on hover
    - CTA button: white background, black text

    **Buttons:**
    - Large padding (1.2rem × 2.5rem)
    - Rounded (border-radius: 50px)
    - Hover lifts up with shadow
    - SVG icons inline

    **Tables:**
    - Full-width with rounded corners
    - Colored header row
    - Category separators
    - Hover effect on rows

    ### 5. Grid Systems Used

    **2-Column Grids:**
    - Overview text + features
    - Data flow columns
    - Future improvements

    **3-Column Grids:**
    - Components list
    - Software modules
    - Analysis sections

    **4-Column Grids:**
    - Hero stats
    - Demo specs

    ### 6. Animation & Motion

    **Scroll Animations:**
    - Sections fade in on load
    - 3D arm moves with scroll
    - Smooth scroll-behavior

    **Hover Animations:**
    - Cards lift up
    - Decision cards slide right
    - Buttons scale with shadow
    - Links underline slides in

    **Transitions:**
    - 0.3s ease timing
    - Transform properties for performance
    - Color transitions for links

    ### 7. Spacing System

    - **Micro**: 0.5rem - 1rem (8-16px)
    - **Small**: 1.5rem - 2rem (24-32px)
    - **Medium**: 3rem - 4rem (48-64px)
    - **Large**: 6rem - 8rem (96-128px)

    Section padding: 8rem
    Card padding: 2-3rem
    Grid gaps: 2-4rem

    ### 8. Responsive Breakpoints

    ```css
    Desktop:  > 1200px (default)
    Tablet:   769px - 1200px
    Mobile:   < 768px
    ```

    Mobile adjustments:
    - Single column grids
    - Smaller typography
    - Hidden navigation links
    - Reduced padding

    ### 9. Typography Scale

    ```
    Hero:         7rem → 3rem (mobile)
    Section:      4rem → 2rem (mobile)
    Large Text:   1.5rem → 1.2rem (mobile)
    Body:         1.1rem → 1rem (mobile)
    Small:        0.9rem → 0.85rem (mobile)
    ```

    ### 10. Special Effects

    **Gradient Text:**
    ```css
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    ```

    **Glassmorphism:**
    ```css
    background: rgba(10, 10, 10, 0.8);
    backdrop-filter: blur(20px);
    ```

    **Box Shadows:**
    ```css
    box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
    ```

    ## Comparison: Before vs After

    ### Before (Original)
    - Smaller headings (4rem max)
    - More colorful (purple/blue gradients everywhere)
    - Compact layouts
    - Many bullet points and lists
    - Traditional sections

    ### After (Craflow Style)
    - HUGE headings (7rem hero)
    - Minimal color (black + indigo accent)
    - Spacious layouts with breathing room
    - Grid-based card layouts
    - Bold numbered sections (01, 02, 03)
    - Large text blocks for readability

    ## Best Practices for This Style

    1. **Keep it minimal** - Don't add unnecessary elements
    2. **Trust whitespace** - More space = more focus
    3. **Big and bold** - Don't be afraid of large typography
    4. **Consistent spacing** - Use the spacing system
    5. **Subtle motion** - Animations should enhance, not distract
    6. **Quality over quantity** - Better to have great images than many mediocre ones

    ## Tips for Adding Content

    - Use 2-3 sentence paragraphs
    - Break up long text with subheadings
    - Add visual hierarchy with size
    - Use the numbered cards (01, 02, 03) for steps
    - Keep tables simple and clean
    - Let images be full-width when possible

    ## File Structure

    ```
    your-team-folder/
    ├── index.html          (structure)
    ├── styles.css          (design)
    ├── main.js            (3D animation)
    ├── README.md          (documentation)
    └── media/             (your assets)
        ├── demo-video.mp4
        ├── device-photo.jpg
        ├── system-diagram.png
        └── ...
    ```

    ---

    **Key takeaway**: This design is about confidence. Large type, lots of space, bold decisions. It says "we made something impressive and we're proud of it." Perfect for showcasing your assistive feeding device! 🚀
