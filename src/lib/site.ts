// Only production builds with PUBLIC_INDEXABLE=true can be indexed
export const indexable = import.meta.env.PUBLIC_INDEXABLE === 'true';

export const site = {
  name: 'Mango Chutney',
  title: 'Mango Chutney | Creative digital agency, Adelaide',
  tagline: 'Design with relish.',
  description:
    'Senior specialists who join your team, work in your tools and bring the expertise you’re missing. First release live within 30 days.',
  /** For search results and link previews, worded for the searches the previous site ranked for. */
  metaDescription:
    'Adelaide creative digital agency. Senior designers and engineers for branding, web and app design and development, embedded in your team.',
  locale: 'en_AU',
  email: 'hello@mangochutney.com.au', // TODO: confirm
  telephone: '+61877042233',
  keywords: [
    'Graphic design',
    'Branding',
    'Web design',
    'App design',
    'Web development',
    'App development',
    'Design systems',
    'Shopify',
  ],
  address: ['367c Magill Road', 'St Morris, South Australia'],
  acknowledgement:
    'Mango Chutney acknowledges the Kaurna people, the Traditional Owners of the land where we work, and pays respect to Elders past and present.',

  contactHref: '#contact',
  formAction: '/api/contact',

  footer: {
    follow: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/mango-chutney' },
      { label: 'Instagram', href: 'https://www.instagram.com/mangochutneydesign' },
    ],
  },

  /** Key clients from Figma "10 Client logos". Each slug has a mono SVG in src/assets/clients. */
  clients: [
    { slug: 'cancer-council', name: 'Cancer Council' },
    { slug: 'optus', name: 'Optus' },
    { slug: 'csb', name: 'Crop Shop Boutique' },
    { slug: 'origin', name: 'Origin' },
    { slug: 'seven', name: 'Seven' },
    { slug: 'rspca', name: 'RSPCA' },
    { slug: 'westpac', name: 'Westpac' },
    { slug: 'sweat', name: 'Sweat' },
    { slug: 'salvation-army', name: 'The Salvation Army' },
    { slug: 'wwf', name: 'WWF' },
    { slug: 'rfds', name: 'Royal Flying Doctor Service' },
    { slug: 'unhcr', name: 'UNHCR' },
    { slug: 'beyond-blue', name: 'Beyond Blue' },
    { slug: 'qantas', name: 'Qantas' },
    { slug: 'world-vision', name: 'World Vision' },
    { slug: 'schneider-electric', name: 'Schneider Electric' },
  ],
} as const;
