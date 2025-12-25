# Kilan Rougeot - Portfolio Website

Clean, modern portfolio website built with HTML, CSS, and JavaScript.

## Color Palette - Slate Blue Theme

- **Background**: `#FAFAF9` (Warm off-white)
- **Text Primary**: `#1A1A1A` (Almost black)
- **Text Secondary**: `#666666` (Medium gray)
- **Accent**: `#334155` (Slate blue)
- **Accent Light**: `#E2E8F0` (Pale slate)
- **Border/Lines**: `#E5E5E5` (Light gray)

## Structure

```
Portfolio/
├── index.html              # Main homepage
├── styles.css              # All styling
├── script.js               # JavaScript interactions
├── assets/
│   └── images/
│       ├── hero/           # Hero section images
│       ├── projects/       # Project images
│       └── experience/     # Experience images
├── projects/               # Individual project pages
└── experience/             # Individual experience pages
```

## Adding Images

1. **Hero Image**: Add to `assets/images/hero/` and update the `.hero-image` div in `index.html`
2. **Project Images**: Add to `assets/images/projects/` and update respective `.card-image` divs
3. **Experience Images**: Add to `assets/images/experience/` and update respective `.card-image` divs

## Creating Individual Project/Experience Pages

Create new HTML files in `projects/` or `experience/` folders following this template structure. Each page should link back to the main portfolio.

## Customization

- **Colors**: Edit CSS variables in `:root` section of `styles.css`
- **Content**: Update text directly in `index.html`
- **Layout**: Modify grid settings in `styles.css`

## To Do

- [ ] Add your hero image
- [ ] Add project images
- [ ] Add experience images
- [ ] Create individual project detail pages
- [ ] Create individual experience detail pages
- [ ] Add your resume PDF
- [ ] Replace placeholder content with actual descriptions
- [ ] Test on different browsers and devices

## Browser Support

Works on all modern browsers (Chrome, Firefox, Safari, Edge)
