import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  mainSidebar: [
    "index",
    {
      type: "category",
      label: "Learn",
      collapsed: false, // keeps it open by default
      items: [
        {
          type: "category",
          label: "Full Stacked",
          link: { type: "doc", id: "full-stacked/index" },
          items: ["full-stacked/ep001"],
        },
        {
          type: "category",
          label: "Courses",
          link: { type: "doc", id: "courses/index" },
          items: ["courses/intro-to-uiux"],
        },
        // {
        //   type: "category",
        //   label: "Loci",
        //   items: [
        //     "loci-user-guide/getting-started",
        //     "loci-user-guide/configuration",
        //     "loci-user-guide/automation",
        //   ],
        // },
        // {
        //   type: "category",
        //   label: "Another Product",
        //   items: [
        //     "another-user-guide/setup",
        //     "another-user-guide/advanced-usage",
        //   ],
        // },
      ],
    },
    {
      type: "category",
      label: "Documentations",
      collapsed: false, // keeps it open by default
      items: [
        {
          type: "category",
          label: "Lisa",
          items: [
            "guides/lisa-user-guide/registration",
            "guides/lisa-user-guide/user-management",
            "guides/lisa-user-guide/case-management",
            "guides/lisa-user-guide/task-management",
          ],
        },
        // {
        //   type: "category",
        //   label: "Loci",
        //   items: [
        //     "loci-user-guide/getting-started",
        //     "loci-user-guide/configuration",
        //     "loci-user-guide/automation",
        //   ],
        // },
        // {
        //   type: "category",
        //   label: "Another Product",
        //   items: [
        //     "another-user-guide/setup",
        //     "another-user-guide/advanced-usage",
        //   ],
        // },
      ],
    },
  ],
};

export default sidebars;
