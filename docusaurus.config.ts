import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Learn & Docs",
  tagline: "A hub for tutorials, user manuals and documentations",
  favicon: "img/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://learn.goweki.com",
  baseUrl: "/",

  organizationName: "goweki",
  projectName: "learn",
  trailingSlash: false,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "guides",
        path: "guides",
        routeBasePath: "guides",
        sidebarPath: "./sidebarsGuides.ts",
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "courses",
        path: "courses",
        routeBasePath: "courses",
        sidebarPath: "./sidebarsCourses.ts",
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "code",
        path: "code",
        routeBasePath: "code",
        sidebarPath: "./sidebarsCourses.ts",
      },
    ],
  ],

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: false,
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/social-card.jpg",
    navbar: {
      title: "Home",
      logo: {
        alt: "logo",
        src: "img/logo_icon.svg",
      },
      items: [
        { to: "/courses", label: "Courses", position: "left" },
        { to: "/guides", label: "Guides", position: "left" },
        { to: "/code/full-stacked", label: "Code", position: "left" },
        { to: "/blog", label: "Blog", position: "left" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Quick Links",
          items: [
            { label: "Courses", to: "/courses" },
            { label: "Guides", to: "/guides" },
            { label: "Full Stacked", to: "/code/full-stacked" },
          ],
        },
        // {
        //   title: "Community",
        //   items: [
        //     {
        //       label: "Stack Overflow",
        //       href: "https://stackoverflow.com/questions/tagged/docusaurus",
        //     },
        //     {
        //       label: "Discord",
        //       href: "https://discordapp.com/invite/docusaurus",
        //     },
        //     { label: "X", href: "https://x.com/docusaurus" },
        //   ],
        // },
        {
          title: "More",
          items: [{ label: "Developer", href: "https://github.com/goweki" }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
