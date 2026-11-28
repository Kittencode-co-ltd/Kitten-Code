# Theme

## Part 1 — Token summary
- Brand accent: `--accent-color: #ff4a17` (orange). Headings `#273d4e`, body `#444444`, bg `#ffffff`, surface `#ffffff`, light section bg `#e0dbdb`, dark section bg `#000910`.
- Dark mode via `html[data-theme="dark"]` (theme.js, localStorage `kittencode-theme`).
- Fonts: Latin `Roboto` (body) / `Raleway` (headings) / `Inter` (nav); Thai `Prompt`; CJK use system stacks per `html[lang]`.
- Radius: cards 16–18px, buttons pill 50px. Shadows soft `0 4px 12px rgba(0,0,0,.06)`.
- Breakpoints: Bootstrap (576/768/992/1200), mobile nav < 1200px.
- Icons: Bootstrap Icons. Animation: AOS fade-up, purecounter, Swiper.

Brand assets: `assets/img/LOGO-KittenCode.png` (round badge, white interior, cat in code brackets), team photos `assets/img/team/`, portfolio `assets/img/portfolio/`, FUFU screens `assets/img/fufu/`.

## Part 2 — Raw token definitions (from `assets/css/main.css`, 3,300 lines total)

```css

:root {
  --default-font:
    "Roboto", "Prompt", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --heading-font: "Raleway", "Prompt", sans-serif;
  --nav-font: "Inter", "Prompt", sans-serif;
}


html[lang="th"] {
  --default-font:
    "Prompt", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --heading-font: "Prompt", sans-serif;
  --nav-font: "Prompt", sans-serif;
}


:root {
  --background-color: #ffffff; /* Background color for the entire website, including individual sections */
  --default-color: #444444; /* Default color used for the majority of the text content across the entire website */
  --heading-color: #273d4e; /* Color for headings, subheadings and title throughout the website */
  --accent-color: #ff4a17; /* Accent color that represents your brand on the website. It's used for buttons, links, and other elements that need to stand out */
  --surface-color: #ffffff; /* The surface color is used as a background of boxed elements within sections, such as cards, icon boxes, or other elements that require a visual separation from the global background. */
  --contrast-color: #ffffff; /* Contrast color for text, ensuring readability against backgrounds of accent, heading, or default colors. */
}


:root {
  --nav-color: #e5eaee; /* The default color of the main navmenu links */
  --nav-hover-color: #ff4a17; /* Applied to main navmenu links when they are hovered over or active */
  --nav-mobile-background-color: #ffffff; /* Used as the background color for mobile navigation menu */
  --nav-dropdown-background-color: #ffffff; /* Used as the background color for dropdown items that appear when hovering over primary navigation items */
  --nav-dropdown-color: #444444; /* Used for navigation links of the dropdown items in the navigation menu. */
  --nav-dropdown-hover-color: #ff4a17; /* Similar to --nav-hover-color, this color is applied to dropdown navigation links when they are hovered over. */
}


.light-background {
  --background-color: #e0dbdb;
  --surface-color: #ffffff;
}


.dark-background {
  --background-color: #000910;
  --default-color: #ffffff;
  --heading-color: #ffffff;
  --surface-color: #28323a;
  --contrast-color: #ffffff;
}


:root {
  scroll-behavior: smooth;
}


[data-theme="dark"] {
  /* Deep charcoal — avoids pure black, reduces eye strain */
  --background-color: #0f1117;
  --default-color: #c8cdd5;
  --heading-color: #e8ecf2;
  --accent-color: #ff6b42;
  --surface-color: #1a1d27;
  --contrast-color: #ffffff;

  /* Nav overrides */
  --nav-color: #c8cdd5;
  --nav-hover-color: #ff6b42;
  --nav-mobile-background-color: #1a1d27;
  --nav-dropdown-background-color: #1a1d27;
  --nav-dropdown-color: #c8cdd5;
  --nav-dropdown-hover-color: #ff6b42;
}


html[lang="zh-Hans"] {
  --default-font: "Roboto", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Noto Sans CJK SC", sans-serif;
  --heading-font: "Raleway", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  --nav-font: "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
}


html[lang="ja"] {
  --default-font: "Roboto", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "Noto Sans JP", "Noto Sans CJK JP", sans-serif;
  --heading-font: "Raleway", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif;
  --nav-font: "Inter", "Hiragino Sans", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif;
}


html[lang="ko"] {
  --default-font: "Roboto", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Noto Sans CJK KR", sans-serif;
  --heading-font: "Raleway", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
  --nav-font: "Inter", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
}


html[lang="ko"] body {
  word-break: keep-all;
}


html[lang="zh-Hans"] .text-justify,
html[lang="ja"] .text-justify,
html[lang="ko"] .text-justify {
  text-align: start;
}


html[lang="zh-Hans"] .hero-label,
html[lang="ja"] .hero-label,
html[lang="ko"] .hero-label,
html[lang="zh-Hans"] .hero.hero-minimal .hero-slogan,
html[lang="ja"] .hero.hero-minimal .hero-slogan,
html[lang="ko"] .hero.hero-minimal .hero-slogan {
  letter-spacing: 1px;
}


html[lang="en"] .vision-local {
  display: none;
}
```
