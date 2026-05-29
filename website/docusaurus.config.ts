import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Slot Scheduler',
  tagline: 'Schedule across timezones without the pain',
  favicon: 'img/favicon.ico',

  future: { v4: true },

  url: 'https://practitionist.github.io',
  baseUrl: '/slot-scheduler/',

  organizationName: 'Practitionist',
  projectName: 'slot-scheduler',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Practitionist/slot-scheduler/edit/dev/website/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'Slot Scheduler',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'userSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/Practitionist/slot-scheduler',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting started', to: '/docs/getting-started' },
            { label: 'Invitations', to: '/docs/invitations' },
            { label: 'Join codes', to: '/docs/join-codes' },
          ],
        },
        {
          title: 'More',
          items: [{ label: 'GitHub', href: 'https://github.com/Practitionist/slot-scheduler' }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Practitionist. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
