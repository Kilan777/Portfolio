# Assistive Feeding Device - Project Website

A bold, modern PIE project website inspired by Craflow design aesthetics, featuring a 3D scroll animation of a robotic arm feeding motion.

## Design Features

This website uses a **Craflow-inspired design** with:
- Bold, large typography with tight letter spacing
- Minimalist black background with subtle gradients
- Clean grid layouts and spacious whitespace
- Smooth hover effects and transitions
- Modern glassmorphism effects
- Professional color palette (indigo accent on dark)

## What You Have

- **index.html** - Complete website with all PIE requirements in Craflow style
- **styles.css** - 1200+ lines of modern, polished CSS
- **main.js** - Three.js 3D animation that responds to scrolling
- **media/** - Folder for your project assets

## How to Customize

### 1. Fill in Your Content

Search for these markers in `index.html` and replace with your actual content:

**Hero Section:**
- Update the stats: `3-DOF`, `30fps`, `<$250`, `95%` with your actual numbers

**Demo Section:**
- Replace `[X]cm`, `[X] seconds`, `[X] DOF` with real specs
- Add your demo video/photos in the media placeholder

**Process Section:**
- Fill in all `[Describe what you chose]` with your design decisions
- Explain your rationale for each choice

**Technical Section:**
- Add all component models and specs
- Insert your diagrams (system, circuit, CAD)
- Fill in analysis details

**Budget:**
- Complete the Bill of Materials table with actual costs
- Add all components you used

**Team:**
- List your team members and roles
- Add future improvements

**Links:**
- Replace `[YOUR_GITHUB_LINK]` with your repository URL

### 2. Add Your Media

Place files in the `media/` folder:
```
media/
  ├── demo-video.mp4
  ├── device-photo.jpg
  ├── system-diagram.png
  ├── circuit-schematic.png
  ├── cad-render.png
  └── data-flow-diagram.png
```

Then update the HTML placeholders:
```html
<!-- Replace the placeholder divs with: -->
<img src="media/device-photo.jpg" alt="Assistive feeding device">
<video src="media/demo-video.mp4" controls></video>
```

### 3. Customize Colors (Optional)

In `styles.css`, change the color variables at the top:
```css
:root {
    --bg-primary: #0a0a0a;        /* Main background */
    --bg-secondary: #141414;       /* Section backgrounds */
    --text-primary: #ffffff;       /* Main text */
    --text-secondary: #a0a0a0;     /* Secondary text */
    --accent: #6366f1;             /* Accent color (indigo) */
    --accent-light: #818cf8;       /* Lighter accent */
    --border: rgba(255, 255, 255, 0.1); /* Borders */
}
```

Try these alternatives:
- **Blue**: `--accent: #3b82f6;` and `--accent-light: #60a5fa;`
- **Purple**: `--accent: #8b5cf6;` and `--accent-light: #a78bfa;`
- **Green**: `--accent: #10b981;` and `--accent-light: #34d399;`

### 4. Customize the 3D Animation

In `main.js`, adjust the animation:

**Change colors:**
```javascript
const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x6366f1, // Change this hex color
    metalness: 0.7,
    roughness: 0.2
});
```

**Adjust animation speed:**
```javascript
// Find this line and multiply by different values
const scrollProgress = Math.min(scrollY / scrollHeight, 1);
```

**Camera movement:**
```javascript
camera.position.z = 5 - scrollProgress * 1;  // Adjust these numbers
camera.position.y = 1 - scrollProgress * 0.5;
```

## Testing Locally

**Option 1:** Just open `index.html` in your browser

**Option 2:** Use a local server (recommended):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have it)
npx http-server
```

Then visit: http://localhost:8000

## Deploying to PIE GitHub

1. Follow the instructions in the Google Doc provided by your course
2. Typically you'll:
   - Clone/fork the PIE 2025-03 repository
   - Create a folder for your team (e.g., `assistive-feeding-device`)
   - Copy all these files into your team folder
   - Commit and push
   - Your site will appear at: `https://olincollege.github.io/pie-2025-03/your-team-name/`

## Required Content Checklist

Make sure you have all of these in your final site:

- ✅ Clear project description and objectives
- ✅ Photos/videos of final system in action
- ✅ Design process with trade-offs explained
- ✅ System diagram showing subsystems
- ✅ Data and energy flow diagram
- ✅ Electrical design with schematics
- ✅ Mechanical design with CAD renderings
- ✅ Software description with GitHub link
- ✅ Complete Bill of Materials ($250 budget)
- ✅ Human-written text (no AI-generated content)
- ✅ Team members and acknowledgments

## Design Philosophy

This website follows Craflow's approach:
- **Bold typography** - Large headings grab attention
- **Generous whitespace** - Content breathes
- **Subtle animations** - Smooth, not distracting
- **Grid layouts** - Clean, organized structure
- **Dark theme** - Modern, professional look
- **Accent color** - Guides the eye strategically

## Tips for Success

1. **Be authentic** - Show real problems you faced
2. **Use visuals** - Photos, diagrams, and videos tell stories
3. **Explain decisions** - Why did you choose this approach?
4. **Show the process** - Include failed attempts and iterations
5. **Link your code** - Make the GitHub repo public and documented
6. **Proofread carefully** - Have multiple people review
7. **Test on mobile** - The design is responsive

## Browser Support

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Need Help?

- **GitHub setup**: Ask course assistants
- **Design questions**: Reference the Craflow template at https://craflow.webflow.io/
- **Code issues**: Check browser console for errors
- **Inspiration**: Look at other PIE team pages

Good luck with your project! 🤖

---

**Design inspired by Craflow** - Bold, modern, and professional.
