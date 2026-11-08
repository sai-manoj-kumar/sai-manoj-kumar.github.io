export const site = {
  name: 'Sai Manoj',
  url: 'https://saimanoj.com',
  title: 'Sai Manoj | Senior Software Engineer',
  description:
    'Sai Manoj is a senior software engineer. Backend systems that run at scale, and tools that make AI agents useful.',
  shareDescription: 'Senior software engineer. Backend systems that run at scale, and tools that make AI agents useful.',
  links: {
    linkedin: 'https://www.linkedin.com/in/sai-manoj-kumar',
    github: 'https://github.com/sai-manoj-kumar',
  },
  hero: {
    sentence: 'I own the systems that deliver 100M webhook events a day.',
    figure: '100M',
    pipelineLabel: 'How a webhook event is delivered',
    stages: [
      { id: 'event', label: 'Event' },
      { id: 'queue', label: 'Queue' },
      { id: 'delivery', label: 'Delivery service ×3', fact: '30% fewer failed deliveries' },
      { id: 'endpoint', label: 'Customer endpoint', fact: '25% lower latency' },
    ],
  },
  limiter: {
    heading: 'Try a rate limiter',
    note: 'The demo is a token bucket, the idea behind rate limiting at a gateway: five tokens, and a new one every two seconds.',
  },
  experience: [
    {
      company: 'LinkedIn',
      project: 'Webhooks Platform',
      title: 'Senior Software Engineer',
      slug: 'webhooks',
      summary: 'Owner of three webhook delivery services that carry about 100 million events a day.',
      visual: null,
      paragraphs: [
        'Sole owner and the DRI engineer for three webhook delivery services that carry about 100 million events a day. I also maintain the authentication middleware on the API Gateway, which handles about 1 billion requests a day.',
        'Designed a new retry mechanism that cut failed deliveries by 30%, and moved webhook processing to a new framework that cut latency by 25%.',
        'Built a monitoring dashboard and debugging tools for on-call, and shared GenAI skills and plugins that speed up root-cause analysis across teams.',
      ],
    },
    {
      company: 'Microsoft',
      project: 'Defender',
      title: 'Software Engineer II',
      slug: 'memory',
      summary: "Cut a mobile security app's memory use by 30%.",
      visual: 'memory',
      paragraphs: [
        'Led the integration of a partner VPN into Microsoft Defender, a mobile security app, and cut its memory use by 30% on end-user mobile devices.',
        'Built telemetry and crash reporting for production monitoring, and an on-prem lab to validate anti-phishing detection. Wrote cross-platform test automation in Python and bash for weekly regression runs, and mentored junior engineers.',
      ],
    },
    {
      company: 'Microsoft',
      project: 'Application Gateway',
      title: 'Software Engineer II',
      slug: 'rewrite',
      summary: 'Led Header Rewrite on a web traffic load balancer.',
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
      slug: 'trace',
      summary: 'Wrote the agent that checks network paths and connectivity.',
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
  },
  footer: { year: 2026 },
};
