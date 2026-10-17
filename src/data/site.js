export const site = {
  name: 'Sai Manoj',
  url: 'https://saimanoj.com',
  title: 'Sai Manoj',
  description:
    'Sai Manoj is a senior software engineer in India. Backend services on public cloud, and tools for AI coding agents.',
  shareDescription: 'Senior software engineer. Backend services on public cloud, and tools for AI coding agents.',
  links: {
    linkedin: 'https://www.linkedin.com/in/sai-manoj-kumar',
    github: 'https://github.com/sai-manoj-kumar',
  },
  hero: {
    titleWords: ['Sai Manoj', 'Backend', 'Engineer'],
    facts: ['Senior software engineer', 'India', 'Java, Python, C#'],
    sentence: 'Services on public cloud. Tools for AI agents.',
    cta: 'Connect on LinkedIn',
    githubLabel: 'GitHub',
    photoAlt: 'A long aisle between white server racks in a data center in Amravati, India',
    portraitAlt: 'Portrait of Sai Manoj',
  },
  experience: [
    {
      company: 'LinkedIn',
      project: 'Webhooks Platform',
      title: 'Senior Software Engineer',
      tone: 'light',
      visual: 'ticketDemo',
      paragraphs: [
        'Sole owner and the DRI engineer for three webhook delivery services that carry about 100 million events a day. I also maintain the authentication middleware on the API Gateway, which handles about 1 billion requests a day.',
        'Designed a new retry mechanism that cut failed deliveries by 30%, and moved webhook processing to a new framework that cut latency by 25%.',
        'Built a monitoring dashboard and debugging tools for on-call, and shared GenAI skills and plugins that speed up root-cause analysis across teams.',
      ],
      note: 'The demo is a token bucket, the idea behind rate limiting at a gateway: five tokens, and a new one every two seconds.',
    },
    {
      company: 'Microsoft',
      project: 'Defender',
      title: 'Software Engineer II',
      tone: 'dark',
      visual: 'memory',
      paragraphs: [
        'Led the integration of a partner VPN into Microsoft Defender, a mobile security app, and cut its memory use by 30% to meet product requirements.',
        'Built telemetry and crash reporting for production monitoring, and an on-prem lab to validate anti-phishing detection. Wrote cross-platform test automation in Python and bash for weekly regression runs, and mentored five new hires.',
      ],
    },
    {
      company: 'Microsoft',
      project: 'Application Gateway',
      title: 'Software Engineer II',
      tone: 'light',
      visual: 'rewrite',
      paragraphs: [
        'Application Gateway is a web traffic load balancer. I led the Header Rewrite feature, which lets customers change header values as traffic is routed. I defined the public API contract, took it through design approval, and built the backend logic to run rewrites at scale on a busy gateway.',
        'Took on-call rotations, wrote troubleshooting guides, and mentored four new teammates.',
      ],
    },
    {
      company: 'Microsoft',
      project: 'Network Monitoring',
      title: 'Software Engineer',
      tone: 'dark',
      visual: 'trace',
      paragraphs: [
        "Wrote the agent for Service Connectivity Monitor in C and C++. It sends pings and traceroutes to check network connectivity and path health. I drove the agent's design and set up its unit and end-to-end tests.",
        'Built the backend for ExpressRoute monitoring with microservices and MapReduce, to process large volumes of network path data, and did the relational data modeling.',
      ],
    },
  ],
  stack: [
    {
      title: 'Backend',
      items: [
        ['Java, Python, C#', 'The languages I work in'],
        ['C and C++', 'A network monitoring agent at Microsoft'],
        ['Kafka', 'The API Gateway and the webhooks platform at LinkedIn'],
        ['Microservices, MapReduce', 'ExpressRoute monitoring at Microsoft'],
      ],
    },
    {
      title: 'Cloud',
      items: [
        ['Azure, AWS, Cloudflare', 'Where I deploy and run services'],
        ['GitHub Actions', 'CI/CD pipelines I write and fix'],
        ['Load balancing', 'Application Gateway at Microsoft'],
      ],
    },
    {
      title: 'Data',
      items: [
        ['PostgreSQL', 'Relational databases and data modeling'],
        ['Redis', 'In-memory data store'],
        ['DynamoDB', 'NoSQL database'],
      ],
    },
    {
      title: 'AI agent tooling',
      items: [['GenAI skills and plugins', 'Root-cause analysis and alert correlation for webhook workflows']],
    },
  ],
  about: {
    paragraphs: [
      "I'm a senior software engineer with about nine years of backend experience, most of it on services that run on public cloud and handle a lot of traffic.",
      "I've worked on a web traffic load balancer, network monitoring and a webhooks platform. Along the way I've mentored new hires and interviewed candidates.",
      "These days I'm building GenAI skills and plugins that help engineers debug faster.",
    ],
    closing: {
      before: "If you're hiring, or building something and want another engineer to talk to, ",
      linkText: 'say hello on LinkedIn',
      after: '.',
    },
    signRole: 'Senior software engineer',
    tearCta: 'Say hello on LinkedIn',
  },
  connect: {
    heading: 'Connect with me',
    text: 'Hiring, building something, or just curious? A message is the easiest way in.',
    linkedinLabel: 'Message me on LinkedIn',
    githubLabel: 'Find me on GitHub',
  },
  footer: { year: 2026 },
  photoCredit: {
    title: 'Racks Amravati Data Center',
    titleUrl: 'https://commons.wikimedia.org/wiki/File:Racks_Amravati_Data_Center.jpg',
    author: 'PiDatacenters',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    source: 'Wikimedia Commons',
    note: 'Shown in greyscale and tinted.',
  },
};
