/**
 * Every word on the page. Facts come from Jei's résumé and public GitHub
 * repositories; the project screens are illustrative sketches, and the page says so.
 */

const GH = 'https://github.com/jeisurya15';

export const brand = {
  name: 'Jei Surya T',
  wordmark: 'JEI SURYA',
  role: 'Java full-stack developer',
  email: 'jeisurya624@gmail.com',
  github: GH,
  linkedin: 'https://www.linkedin.com/in/jeisurya15',
};

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Journey', href: '#journey' },
  { label: 'Stack', href: '#stack' },
  { label: 'Contact', href: '#contact' },
];

export const hero = {
  title: 'JEI SURYA',
  kicker: 'Java full-stack developer · B.Tech IT',
  site: 'SKCET · Coimbatore · 10.94°N 76.96°E',
  greeting: 'Hi, I’m Jei.',
  pitch:
    'I take an idea from database schema to deployed web app: Spring Boot APIs, secure sign-in, and fast, clean React interfaces.',
  stack: ['Java', 'Spring Boot', 'React', 'MySQL'],
  // The headline's last word cycles through these.
  words: ['full-stack apps.', 'Spring Boot APIs.', 'React interfaces.', 'MySQL schemas.'],
  orbit: ['Java', 'Spring', 'React', 'MySQL', 'JWT', 'REST', 'Maven', 'Git'],
  status: 'Open to full-time roles & freelance',
  location: 'Coimbatore, India',
};

export const intro = {
  eyebrow: 'Projects',
  heading: 'Five builds, from schema to screen.',
  body: 'I design the data first, expose it through REST APIs in Spring Boot or Express, and build the interface in React.',
};

/**
 * The projects. `screen` picks the interface sketch shown until a live preview
 * is loaded; `live` is the deployed site (empty until it's published), `repo`
 * the source.
 */
export const work = [
  {
    slug: 'lms',
    title: 'Learning platform',
    kind: 'Enterprise LMS',
    body: 'Courses, assessments and progress tracking for students, instructors and admins, on Spring Boot microservices with role-based access.',
    features: [
      'Course delivery in modules',
      'Assessments and grading',
      'Progress per learner',
      'Role-based access',
    ],
    stack: ['Java', 'Spring Boot', 'Microservices', 'React', 'MySQL'],
    screen: 'lms',
    live: '',
    repo: '',
  },
  {
    slug: 'smartqueue',
    title: 'SmartQueue',
    kind: 'Queue & appointments',
    body: 'Walk-in queues and booked appointments with a live wait estimate: people in line × average service time ÷ open counters.',
    features: [
      'Wait-time prediction',
      'Counter-based service flow',
      'Appointments and walk-ins',
      'Staff and visitor roles',
    ],
    stack: ['Java', 'Spring Boot', 'React', 'MySQL', 'REST'],
    screen: 'queue',
    live: '',
    repo: '',
  },
  {
    slug: 'shop',
    title: 'Shopping cart',
    kind: 'Full-stack e-commerce',
    body: 'Catalogue, cart, wishlist, orders and an admin dashboard, secured with JWT, bcrypt, Zod validation and rate limiting.',
    features: [
      'Filters and comparison',
      'Cart, wishlist, checkout',
      'Order history',
      'Admin dashboard',
    ],
    stack: ['React', 'Vite', 'Node.js', 'Express', 'Sequelize', 'MySQL'],
    screen: 'shop',
    live: '',
    repo: `${GH}/Shopping-cart`,
  },
  {
    slug: 'fitness',
    title: 'Fitness tracker',
    kind: 'Goal tracking',
    body: 'Set a goal, log each day and watch progress against the target, through a layered controller → service → repository API.',
    features: ['Goal form', 'Daily activity log', 'Progress dashboard', 'Per-user history'],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'React', 'MySQL'],
    screen: 'fitness',
    live: '',
    repo: `${GH}/fitness_goal_tracker`,
  },
  {
    slug: 'lab',
    title: 'The lab',
    kind: 'AI · data · testing',
    body: 'A ResNet50 image classifier trained in two phases, a Power BI campaign dashboard and a Selenium + TestNG browser test suite.',
    features: [
      'Transfer learning on ResNet50',
      'Power BI campaign report',
      'Automated browser tests',
    ],
    stack: ['Python', 'TensorFlow', 'Power BI', 'Selenium', 'TestNG'],
    screen: 'lab',
    live: '',
    repo: `${GH}/Image_Based_Animal_Type_Classification`,
  },
];

/** The learning path, drawn as a route from backend developer to AI engineer. */
export const journey = {
  eyebrow: 'Learning path',
  heading: 'From backend developer to AI engineer, drawn as you scroll.',
  from: { label: 'BACKEND DEV', sub: 'JAVA · SPRING' },
  to: { label: 'AI ENGINEER', sub: 'LLMS · PROMPTS' },
  legs: [
    {
      when: 'Phase 01 · Built',
      title: 'Backend foundations',
      body: 'Java, Spring Boot and REST APIs on top of SQL databases. Clean service layers, auth, testing, and the habit of shipping software that holds up under real use.',
    },
    {
      when: 'Phase 02 · Built',
      title: 'Full stack developer',
      body: 'React front ends on top of my own Spring Boot APIs: routing, state, forms and auth, wired end to end so a feature goes from database to screen in one piece.',
    },
    {
      when: 'Phase 03 · Learning',
      title: 'LLMs and prompt engineering',
      body: 'How large language models behave: system prompts, few-shot examples, structured JSON output, tool calling, and writing evals to measure whether a prompt actually got better.',
    },
    {
      when: 'Phase 04 · Next',
      title: 'AI engineering',
      body: 'RAG with embeddings and vector databases, agents that use tools, and LLM features wired into solid backends: the backend skills and the AI skills, in one engineer.',
    },
  ],
};

export const stack = {
  eyebrow: 'Stack',
  heading: 'Built from the ground up.',
  note: 'Scroll to build the pyramid',
  /** Bottom to top: each tier stands on the one below it. */
  tiers: [
    {
      name: 'Foundations',
      tag: 'Bedrock',
      blurb: 'The languages and fundamentals everything else is built on.',
      items: [
        'Java',
        'JavaScript',
        'SQL',
        'C++',
        'OOP',
        'Data structures & algorithms',
        'Git & GitHub',
      ],
    },
    {
      name: 'Backend',
      tag: 'Main focus',
      featured: true,
      blurb: 'Where most of my work lives: APIs, data and security, done properly.',
      items: [
        'Spring Boot',
        'Spring Data JPA',
        'REST APIs',
        'Node.js · Express',
        'MySQL',
        'JWT · bcrypt · RBAC',
      ],
    },
    {
      name: 'Frontend',
      tag: 'Interface',
      blurb: 'React front ends wired end to end to my own APIs.',
      items: ['React.js', 'Vite', 'React Router', 'Axios', 'Framer Motion', 'HTML5 · CSS3'],
    },
    {
      name: 'Test & ship',
      tag: 'Delivery',
      blurb: 'Automated tests, builds and deploys, so features actually reach users.',
      items: [
        'Selenium WebDriver',
        'TestNG',
        'Maven',
        'Azure App Service',
        'Vercel',
        'Firebase Hosting',
      ],
    },
    {
      name: 'AI',
      tag: 'Learning now',
      apex: true,
      blurb: 'The peak I am climbing toward: LLMs on top of solid backends.',
      items: ['LLM APIs', 'Prompt engineering', 'Structured outputs', 'Tool calling', 'RAG basics'],
    },
  ],
  /**
   * The full toolkit, as glass boxes under the pyramid. `icon` is a Devicon
   * path (devicon/icons/<icon>.svg); items without one get a drawn badge.
   */
  toolkit: [
    {
      id: 'languages',
      name: 'Languages',
      accent: '#6fb6ff',
      blurb: 'What I write every day, from typed backends to the browser.',
      items: [
        {
          name: 'Java',
          icon: 'java/java-original',
          note: 'Main language: Spring Boot services, OOP, collections and streams.',
        },
        {
          name: 'JavaScript',
          icon: 'javascript/javascript-original',
          note: 'React front ends and Node.js / Express APIs.',
        },
        {
          name: 'Python',
          icon: 'python/python-original',
          note: 'Scripting, automation and data work; my way into LLM tooling.',
        },
        {
          name: 'C++',
          icon: 'cplusplus/cplusplus-original',
          note: 'Data structures and algorithms practice.',
        },
        {
          name: 'SQL',
          icon: 'azuresqldatabase/azuresqldatabase-original',
          note: 'Joins, aggregates, indexes and query tuning.',
        },
      ],
    },
    {
      id: 'databases',
      name: 'Databases',
      accent: '#5fe3c0',
      blurb: 'Where the data lives, and how it is shaped.',
      items: [
        {
          name: 'MySQL',
          icon: 'mysql/mysql-original',
          note: 'Primary relational store behind my Spring Boot projects.',
        },
        {
          name: 'SQLite',
          icon: 'sqlite/sqlite-original',
          note: 'Lightweight local storage for prototypes and tests.',
        },
        {
          name: 'Sequelize',
          icon: 'sequelize/sequelize-original',
          note: 'ORM for Node.js: models, associations, migrations.',
        },
        {
          name: 'Schema design',
          glyph: 'schema',
          note: 'Normalisation, keys and relations before a line of code.',
        },
      ],
    },
    {
      id: 'security',
      name: 'Security',
      accent: '#ff8a7a',
      blurb: 'Keeping accounts, data and APIs safe by default.',
      items: [
        { name: 'JWT', glyph: 'jwt', note: 'Stateless auth tokens with expiry and refresh.' },
        { name: 'bcrypt', glyph: 'lock', note: 'Salted password hashing, never plain text.' },
        {
          name: 'Role-based access',
          glyph: 'shield',
          note: 'RBAC: admin, staff and user permissions on every route.',
        },
        {
          name: 'Zod',
          icon: 'zod/zod-original',
          note: 'Schema validation for every request body.',
        },
        {
          name: 'Rate limiting',
          glyph: 'gauge',
          note: 'Throttling to stop brute force and abuse.',
        },
      ],
    },
    {
      id: 'cloud',
      name: 'Cloud',
      accent: '#b79bff',
      blurb: 'Getting builds out of my laptop and onto the internet.',
      items: [
        {
          name: 'Azure App Service',
          icon: 'azure/azure-original',
          note: 'Hosting Java and Node back ends.',
        },
        {
          name: 'Vercel',
          icon: 'vercel/vercel-original',
          invert: true,
          note: 'Front-end deploys with previews on every push.',
        },
        {
          name: 'Firebase Hosting',
          icon: 'firebase/firebase-original',
          note: 'Fast static hosting with a CDN.',
        },
      ],
    },
    {
      id: 'tools',
      name: 'Tools',
      accent: '#ffb35c',
      blurb: 'The bench every project is built on.',
      items: [
        { name: 'Git', icon: 'git/git-original', note: 'Branches, rebases and clean history.' },
        {
          name: 'GitHub',
          icon: 'github/github-original',
          invert: true,
          note: 'Repos, pull requests and Actions.',
        },
        {
          name: 'Maven',
          icon: 'maven/maven-original',
          note: 'Java builds and dependency management.',
        },
        { name: 'npm', icon: 'npm/npm-original-wordmark', note: 'Node packages and scripts.' },
        { name: 'VS Code', icon: 'vscode/vscode-original', note: 'Daily editor.' },
        {
          name: 'Lombok',
          glyph: 'chili',
          note: 'Less Java boilerplate: getters, builders, constructors.',
        },
      ],
    },
    {
      id: 'foundations',
      name: 'Foundations',
      accent: '#7fd3ff',
      blurb: 'The computer science underneath the frameworks.',
      items: [
        { name: 'OOP', glyph: 'cubes', note: 'Encapsulation, inheritance, polymorphism, SOLID.' },
        {
          name: 'Data structures & algorithms',
          glyph: 'tree',
          note: 'Arrays to graphs; complexity and trade-offs.',
        },
        { name: 'DBMS', glyph: 'cylinder', note: 'Transactions, normal forms and indexing.' },
        { name: 'Testing', glyph: 'check', note: 'Unit tests, Selenium and TestNG.' },
      ],
    },
  ],
  certificates: [
    'Infosys Springboard · Java',
    'Infosys Springboard · Data Structures',
    'Udemy · Advanced Excel for Data Analytics',
    'Accenture · iAspire Achievement',
  ],
};

export const finale = {
  eyebrow: 'Contact',
  hint: 'Keep scrolling',
  body: 'Open to full-time roles, freelance projects or just a good question. I answer within a day or two.',
};
