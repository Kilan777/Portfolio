# Portfolio Website Setup Guide

This guide will help you set up the contact form and analytics for your portfolio website.

## Contact Form Setup (Formspree)

The contact form is currently configured to use Formspree, a free service for handling form submissions.

### Steps:

1. **Create a Formspree Account**
   - Go to [https://formspree.io](https://formspree.io)
   - Sign up for a free account (allows 50 submissions/month)

2. **Create a New Form**
   - Click "New Form"
   - Give it a name (e.g., "Portfolio Contact Form")
   - You'll get a form endpoint URL like: `https://formspree.io/f/abc123xyz`

3. **Update contact.html**
   - Open `contact.html`
   - Find line 191: `action="https://formspree.io/f/YOUR_FORM_ID"`
   - Replace `YOUR_FORM_ID` with your actual form ID
   - Example: `action="https://formspree.io/f/abc123xyz"`

4. **Test the Form**
   - Open your website
   - Go to the Contact page
   - Submit a test message
   - Check your email - you should receive the form submission!

### Alternative Contact Form Services:

- **EmailJS** - [https://www.emailjs.com/](https://www.emailjs.com/)
- **Web3Forms** - [https://web3forms.com/](https://web3forms.com/)
- **Basin** - [https://usebasin.com/](https://usebasin.com/)

---

## Google Analytics Setup

Track visitors, page views, and user behavior on your website.

### Steps:

1. **Create Google Analytics Account**
   - Go to [https://analytics.google.com](https://analytics.google.com)
   - Sign in with your Google account
   - Click "Start measuring"

2. **Create a Property**
   - Enter your website name (e.g., "Kilan Rougeot Portfolio")
   - Select timezone and currency
   - Click "Next"

3. **Get Your Measurement ID**
   - Complete the setup process
   - You'll receive a Measurement ID like: `G-XXXXXXXXXX`
   - Copy this ID

4. **Update index.html**
   - Open `index.html`
   - Find lines 18 and 23 where it says `G-XXXXXXXXXX`
   - Replace both instances with your actual Measurement ID
   - Example:
     ```html
     <script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123DEF4"></script>
     <script>
         window.dataLayer = window.dataLayer || [];
         function gtag(){dataLayer.push(arguments);}
         gtag('js', new Date());
         gtag('config', 'G-ABC123DEF4');
     </script>
     ```

5. **Verify Installation**
   - Go to Google Analytics
   - Navigate to Reports > Realtime
   - Open your website in another tab
   - You should see your visit appear in realtime!

### What You Can Track:

- **Audience**: Where visitors are from, what devices they use
- **Acquisition**: How people find your website (search, direct, referrals)
- **Behavior**: What pages they visit, how long they stay
- **Events**: Track specific actions (form submissions, link clicks, etc.)

---

## Adding Images to Project Pages

All project and experience pages have image placeholders marked with:
```
[Add image here - 1200x600px recommended]
```

### To Add Images:

1. Save your images in the `Pics/` folder
2. Edit the page HTML
3. Replace the placeholder with:
```html
<div class="detail-image">
    <img src="../Pics/your-image.jpg" alt="Description" style="width: 100%; height: auto; display: block; border-radius: var(--border-radius);">
</div>
```

### Recommended Image Sizes:

- **Main hero images**: 1200x600px
- **Detail images**: 800x500px minimum
- **Format**: JPG for photos, PNG for screenshots/graphics
- **Optimization**: Use tools like TinyPNG or Squoosh to reduce file size

---

## Need Help?

- **Formspree Documentation**: [https://help.formspree.io/](https://help.formspree.io/)
- **Google Analytics Help**: [https://support.google.com/analytics](https://support.google.com/analytics)

---

## Quick Checklist

- [ ] Set up Formspree and update contact.html
- [ ] Set up Google Analytics and update index.html
- [ ] Add images to all project/experience pages
- [ ] Test contact form submission
- [ ] Verify Google Analytics is tracking in Realtime view
- [ ] Add your own content to template pages (line follower, go kart, etc.)
