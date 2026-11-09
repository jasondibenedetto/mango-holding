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

  /**
   * Key clients from Figma "10 Client logos" first, then every other current client. Each slug has a
   * mono SVG in src/assets/clients. boost enlarges a fine-lined mark that reads small at its optical size.
   */
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
    { slug: 'adaptly', name: 'Adaptly' },
    { slug: 'animal-welfare-league', name: 'Animal Welfare League SA' },
    { slug: 'austral-clotheslines', name: 'Austral Clotheslines' },
    { slug: 'amwa', name: "Australian Multicultural Women's Alliance" },
    { slug: 'camp-quality', name: 'Camp Quality' },
    { slug: 'chiaprt', name: 'Centre for Health in All Policies Research Translation' },
    { slug: 'eha', name: 'Eastern Health Authority' },
    { slug: 'ezlicence', name: 'EzLicence' },
    { slug: 'fecca', name: "Federation of Ethnic Communities' Councils of Australia" },
    { slug: 'findon-high-school', name: 'Findon High School' },
    { slug: 'flinders-foundation', name: 'Flinders Foundation' },
    { slug: 'flinders-university', name: 'Flinders University' },
    { slug: 'gleamin', name: 'Gleamin' },
    { slug: 'hireup', name: 'Hireup' },
    { slug: 'jones-radiology', name: 'Jones Radiology' },
    { slug: 'justicenet', name: 'JusticeNet SA' },
    { slug: 'leukaemia-foundation', name: 'Leukaemia Foundation' },
    { slug: 'lk-law', name: 'LK Law' },
    { slug: 'lusta', name: 'Lusta Hair' },
    { slug: 'neura', name: 'Neuroscience Research Australia' },
    { slug: 'open-gardens-sa', name: 'Open Gardens SA', boost: 1.3 },
    { slug: 'parkbooker', name: 'Parkbooker' },
    { slug: 'radiology-sa', name: 'Radiology SA', boost: 1.5 },
    {
      slug: 'ranzcog',
      name: 'Royal Australian and New Zealand College of Obstetricians and Gynaecologists',
    },
    { slug: 'sa-cfs', name: 'SA Country Fire Service' },
    { slug: 'sa-power-networks', name: 'SA Power Networks', boost: 1.3 },
    { slug: 'sa-ses', name: 'SA State Emergency Service' },
    { slug: 'sahmri', name: 'South Australian Health and Medical Research Institute', boost: 1.3 },
    { slug: 'the-people-plugin', name: 'The People Plugin' },
    { slug: 'trend-rocket', name: 'Trend Rocket' },
    { slug: 'volliecare', name: 'VollieCare' },
    { slug: 'walford', name: 'Walford Anglican School for Girls' },
    { slug: 'wilderness-school', name: 'Wilderness School' },
    { slug: 'women-lawyers-sa', name: "Women Lawyers' Association of South Australia" },
    { slug: 'wlsq', name: "Women's Legal Service Queensland" },
  ],
} as const;
