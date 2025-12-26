# Visual Reference - What Your Site Looks Like

## Hero Section (Top of Page)
```
┌─────────────────────────────────────────────────────────┐
│  AFD.                    Home Overview Process Technical │
│                                           [View Demo →]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [PIE Project 2025]                                     │
│                                                          │
│  We help people                                         │
│  with disabilities                                       │
│  feed independently      ← HUGE text (7rem!)            │
│  through intelligent                                     │
│  robotics.                                              │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │3-DOF │  │30fps │  │<$250 │  │ 95%  │              │
│  │Arm   │  │Track │  │Cost  │  │Accur.│              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
│                                                          │
│     [3D Robotic Arm Animation - moves as you scroll]    │
└─────────────────────────────────────────────────────────┘
```

## Overview Section
```
┌─────────────────────────────────────────────────────────┐
│                     ABOUT THE PROJECT                    │
│                                                          │
│  Assistive feeding device that combines computer        │
│  vision, robotics, and embedded systems                 │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────┐       │
│  │  Large descriptive │  │  [01]              │       │
│  │  paragraph about   │  │  Independent Feeding│       │
│  │  the project...    │  │  [02]              │       │
│  │                    │  │  Real-Time Tracking│       │
│  │  Another paragraph │  │  [03]              │       │
│  │  with details...   │  │  Safe Design       │       │
│  │                    │  │  [04]              │       │
│  │                    │  │  Affordable        │       │
│  └────────────────────┘  └────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Demo Section
```
┌─────────────────────────────────────────────────────────┐
│                     SYSTEM DEMO                          │
│                     Watch it in action                   │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                    │  │
│  │         [Video/Photo Placeholder]                 │  │
│  │              ▶ Play Symbol                        │  │
│  │                                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Tracking  │ │Response  │ │Safety    │ │Degrees   │ │
│  │Accuracy  │ │Time      │ │Features  │ │of Freedom│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Process Section (Design Decisions)
```
┌─────────────────────────────────────────────────────────┐
│                     OUR PROCESS                          │
│                Design decisions and trade-offs           │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  01                                              │   │
│  │  Robotic Arm Configuration                      │   │
│  │  Options: 3-DOF, 4-DOF SCARA, 2-DOF pan-tilt  │   │
│  │  Our Choice: [Your choice here]                 │   │
│  │  Rationale: [Why you chose it]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  02                                              │   │
│  │  Mouth Tracking Approach                        │   │
│  │  Options: MediaPipe, OpenCV, CNN, depth camera  │   │
│  │  ...                                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  03                                              │   │
│  │  Computing Platform                              │   │
│  │  ...                                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Technical Section
```
┌─────────────────────────────────────────────────────────┐
│                     TECHNICAL                            │
│                Design specifications and analysis        │
│                                                          │
│  Data and Energy Flow                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │         [Diagram placeholder]                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Data Flow          │  Energy Flow                      │
│  1. Camera captures │  Wall adapter →                   │
│  2. CV processes    │  Voltage regulators →             │
│  3. Motion planning │  Motors + Computing               │
│  ...                │  ...                              │
│                                                          │
│  Electrical Design                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │Micro-    │ │Camera    │ │Motors    │               │
│  │controller│ │Model     │ │Type/Specs│               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                          │
│  [Circuit schematic placeholder]                        │
│                                                          │
│  Mechanical Design                                      │
│  [CAD renderings placeholder]                           │
│                                                          │
│  Software and Firmware                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │Computer      │ │Motion        │ │User          │   │
│  │Vision        │ │Control       │ │Interface     │   │
│  │Tech: OpenCV  │ │IK Solution   │ │Buttons/Voice │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                          │
│  Python  OpenCV  NumPy  MediaPipe  [more tags]         │
│                                                          │
│          [View Source Code →]                           │
└─────────────────────────────────────────────────────────┘
```

## Budget Section (Bill of Materials)
```
┌─────────────────────────────────────────────────────────┐
│                     BUDGET                               │
│                     Bill of materials                    │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Component          │Qty│Unit Cost│Total │Source  │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ Computing & Vision                                │  │
│  │ Raspberry Pi 4     │ 1 │ $55.00  │$55.00│Amazon  │  │
│  │ Pi Camera Module   │ 1 │ $25.00  │$25.00│Amazon  │  │
│  │ MicroSD 32GB       │ 1 │  $8.00  │ $8.00│Amazon  │  │
│  │                                                    │  │
│  │ Motors & Actuation                                │  │
│  │ [Your motors]      │[#]│ $XX.XX  │$XX.XX│[Source]│  │
│  │                                                    │  │
│  │ ... [more rows] ...                               │  │
│  │                                                    │  │
│  │ Total Project Cost              │$XXX.XX│        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Team Section
```
┌─────────────────────────────────────────────────────────┐
│                     TEAM                                 │
│                     Meet the makers                      │
│                                                          │
│  [List team members and roles here]                     │
│                                                          │
│  Acknowledgments                                        │
│  [Thank you section]                                    │
│                                                          │
│  Future Improvements                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│  │01      │ │02      │ │03      │ │04      │         │
│  │Multiple│ │Voice   │ │Safety  │ │Portable│         │
│  │Foods   │ │Control │ │Sensors │ │Power   │         │
│  └────────┘ └────────┘ └────────┘ └────────┘         │
└─────────────────────────────────────────────────────────┘
```

## Footer
```
┌─────────────────────────────────────────────────────────┐
│  AFD.                             All PIE Projects      │
│  Assistive Feeding Device         GitHub Repository     │
│                                                          │
│  PIE Project © 2025 — Olin College of Engineering       │
└─────────────────────────────────────────────────────────┘
```

## Color Scheme Preview

Background Colors:
- Main sections: #0a0a0a (almost black)
- Alternate sections: #141414 (slightly lighter)
- Cards: rgba(255, 255, 255, 0.02) with border

Text Colors:
- Headers: #ffffff (white)
- Body: #a0a0a0 (gray)
- Accent: #6366f1 (indigo)

## Typography Scale
- Hero Title: 7rem (HUGE - 112px)
- Section Title: 4rem (64px)
- Large Text: 1.5rem (24px)
- Body: 1.1rem (18px)
- Small: 0.9rem (14px)

## Spacing
- Between sections: 8rem (128px)
- Inside sections: 3-4rem (48-64px)
- Card padding: 2-3rem (32-48px)
- Grid gaps: 2-3rem (32-48px)

## Key Design Features
✓ Bold, large typography
✓ Lots of whitespace
✓ Numbered decision cards (01, 02, 03)
✓ Grid-based layouts
✓ Minimal color palette
✓ Smooth hover effects
✓ 3D scroll animation background
✓ Glassmorphism navigation
✓ Rounded pill buttons
✓ Professional table design

---

This is what your site will look like! Clean, modern, and bold.
