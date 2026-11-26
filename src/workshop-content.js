// Facts come from Jei's résumé and public GitHub repositories (github.com/jeisurya15).
const GH = 'https://github.com/jeisurya15';

// The technical stack, grouped the way it is shown in the Stack column and the Stack room.
export const stack = [
  {
    group: 'Languages',
    items: ['Java', 'JavaScript', 'Python', 'C++', 'SQL', 'HTML5', 'CSS3'],
  },
  {
    group: 'Frontend',
    items: ['React.js', 'Vite', 'React Router', 'Axios', 'Framer Motion', 'Responsive UI'],
  },
  {
    group: 'Backend',
    items: ['Spring Boot', 'REST APIs', 'Spring Data JPA', 'Lombok', 'Node.js', 'Express'],
  },
  {
    group: 'Databases',
    items: ['MySQL', 'Sequelize ORM', 'SQLite', 'Schema design', 'DBMS'],
  },
  {
    group: 'Security',
    items: ['JWT auth', 'bcrypt hashing', 'Role-based access', 'Zod validation', 'Rate limiting'],
  },
  {
    group: 'Testing',
    items: ['Selenium WebDriver', 'TestNG', 'Maven Surefire', 'Software testing'],
  },
  {
    group: 'Data & AI',
    items: ['Power BI', 'Advanced Excel', 'TensorFlow / Keras', 'ResNet50 transfer learning'],
  },
  {
    group: 'Cloud & tools',
    items: [
      'Git & GitHub',
      'Maven',
      'npm',
      'Azure App Service',
      'Vercel',
      'Firebase Hosting',
      'VS Code',
    ],
  },
  {
    group: 'Foundations',
    items: [
      'Object-oriented programming',
      'Data structures & algorithms',
      'DBMS',
      'Software testing',
    ],
  },
];

export const chapters = [
  {
    name: 'The entrance',
    room: 'THE CORE',
    slug: 'intro',
    short: 'Start',
    label: 'INSIDE THE MACHINE',
    title: 'Meet the mind<br>behind the <em>build.</em>',
    intro:
      'I’m Jei Surya T, an IT student and Java full-stack developer. I build complete applications, from the React interface to the Spring Boot service and the MySQL schema underneath.',
    tags: ['B.TECH IT · SKCET', 'JAVA FULL STACK', 'CLASS OF 2027'],
    action: 'Meet the developer',
    caption: 'THE CORE / WHERE IDEAS BECOME SYSTEMS',
    detail: {
      title: 'Hello, I’m Jei.',
      lead: 'An Information Technology student at Sri Krishna College of Engineering and Technology who likes software that is efficient, reliable and easy to use.',
      facts: [
        ['Degree', 'B.Tech Information Technology'],
        ['College', 'SKCET'],
        ['Years', '2023 – 2027'],
        ['Focus', 'Java full stack'],
      ],
      blocks: [
        [
          'How I build',
          'I design the data first, expose it through REST APIs in Spring Boot or Express, and build the interface in React. I care about clean layering: controllers, services and repositories each doing one job.',
        ],
        [
          'What I’ve shipped',
          'Full-stack projects for learning management, queue management, fitness tracking and online shopping, plus an image classifier, a Power BI dashboard and an automated test suite.',
        ],
        [
          'Industry experience',
          'A Java Full Stack internship at HCL Infosystems (2026) and an internship at Mist Software Solutions (2025).',
        ],
        [
          'Beyond code',
          'I use Power BI and Advanced Excel to explore data and explain what it means to people who don’t read code.',
        ],
      ],
      links: [['GitHub profile', GH]],
    },
  },
  {
    name: 'The stack',
    room: 'THE STACK',
    slug: 'stack',
    short: 'Stack',
    label: 'TECHNICAL STACK',
    title: 'Every layer,<br>one <em>column.</em>',
    intro:
      'Nine layers of tools I have learned as an IT student and used in real projects, from languages at the base to deployment at the top.',
    tags: ['JAVA', 'SPRING BOOT', 'REACT', 'MYSQL', 'NODE.JS', 'PYTHON'],
    action: 'Open the full stack',
    demo: 'Expand the column',
    caption: 'THE STACK / LAYER BY LAYER',
    detail: { stackView: true },
  },
  {
    name: 'Learning systems',
    room: 'CAMPUS',
    slug: 'lms',
    short: 'LMS',
    label: 'ENTERPRISE LEARNING PLATFORM',
    title: 'A system for<br>every <em>next step.</em>',
    intro:
      'Courses, assessments and progress tracking for students, instructors and administrators, built on a Spring Boot microservices backend.',
    tags: ['SPRING BOOT', 'MICROSERVICES', 'REACT', 'RBAC'],
    action: 'Explore the architecture',
    demo: 'Separate the layers',
    caption: 'LEARNING / CONNECTED',
    detail: {
      title: 'Enterprise Learning Management Platform',
      lead: 'A full-stack learning management system that supports course delivery, assessments and progress tracking across multiple user roles.',
      facts: [
        ['Type', 'Full-stack web app'],
        ['Backend', 'Spring Boot microservices'],
        ['Frontend', 'React'],
        ['Access', 'Role-based'],
      ],
      features: [
        'Course delivery with structured modules',
        'Assessments for evaluating learners',
        'Progress tracking per learner and course',
        'Separate experiences for each user role',
      ],
      blocks: [
        [
          'Architecture',
          'The backend is split into Spring Boot microservices that communicate over RESTful APIs, so each part of the platform can be maintained and scaled on its own.',
        ],
        [
          'Interface',
          'A responsive React frontend talks to the backend APIs and adapts to the signed-in user’s role.',
        ],
        [
          'Security',
          'Role-based access control protects user and academic data, so learners, instructors and administrators only see what they should.',
        ],
        [
          'In this room',
          'Use “Separate the layers” to pull the Courses, Assessments and Progress towers apart into their service layers.',
        ],
      ],
      stack: ['Java', 'Spring Boot', 'REST APIs', 'Microservices', 'React', 'MySQL', 'RBAC'],
    },
  },
  {
    name: 'Smarter queues',
    room: 'FLOW',
    slug: 'smartqueue',
    short: 'SmartQueue',
    label: 'QUEUE & APPOINTMENT MANAGEMENT',
    title: 'Make time<br>for what <em>matters.</em>',
    intro:
      'A queue and appointment system that predicts how long each visitor will wait from the queue size, the average service time and the counters that are open.',
    tags: ['REACT', 'SPRING BOOT', 'MYSQL', 'PREDICTION'],
    action: 'Inside SmartQueue',
    demo: 'Call next visitor',
    caption: 'SMARTQUEUE / NEXT IN LINE',
    detail: {
      title: 'SmartQueue',
      lead: 'A full-stack queue and appointment management system built with React.js, Spring Boot and MySQL.',
      facts: [
        ['Type', 'Full-stack web app'],
        ['Backend', 'Spring Boot'],
        ['Frontend', 'React.js'],
        ['Database', 'MySQL'],
      ],
      features: [
        'Walk-in queues and booked appointments',
        'Dynamic waiting-time prediction',
        'Counter-based service flow',
        'Role-based access for staff and visitors',
      ],
      blocks: [
        [
          'Waiting-time prediction',
          'The estimate combines three live inputs: how many people are in the queue, the average service duration and the number of active counters. In its simplest form: wait ≈ queue × average time ÷ counters.',
        ],
        [
          'Frontend to backend',
          'RESTful APIs connect the React interface to Spring Boot services, which persist queue and appointment data in MySQL.',
        ],
        [
          'Controlled access',
          'Role-based access control separates what staff can manage from what visitors can see.',
        ],
        [
          'In this room',
          'Use “Call next visitor” to send the next person to a counter and watch the prediction update. The numbers are illustrative.',
        ],
      ],
      stack: ['Java', 'Spring Boot', 'REST APIs', 'React.js', 'MySQL', 'RBAC'],
    },
  },
  {
    name: 'Online shopping',
    room: 'CHECKOUT',
    slug: 'shop',
    short: 'Shop',
    label: 'ONLINE SHOPPING CART',
    title: 'From browse<br>to <em>checkout.</em>',
    intro:
      'A full e-commerce application: catalogue, cart, wishlist, orders and an admin dashboard, secured with JWT and backed by MySQL.',
    tags: ['REACT + VITE', 'NODE / EXPRESS', 'MYSQL', 'JWT'],
    action: 'Inside the store',
    demo: 'Add to cart',
    caption: 'CHECKOUT / ADDED TO CART',
    detail: {
      title: 'Online Shopping Cart',
      lead: 'A full-stack e-commerce app with a React (Vite) storefront, a Node.js and Express API, and MySQL through the Sequelize ORM.',
      facts: [
        ['Type', 'Full-stack e-commerce'],
        ['Frontend', 'React + Vite'],
        ['Backend', 'Node.js · Express'],
        ['Data', 'MySQL · Sequelize'],
      ],
      features: [
        'Product catalogue with filters and comparison',
        'Cart, wishlist and checkout',
        'Order history and order details',
        'Recently viewed items and lightning deals',
        'Admin dashboard for products, categories, orders and users',
        'Image uploads for products',
      ],
      blocks: [
        [
          'Security',
          'Passwords are hashed with bcrypt and sessions use JSON Web Tokens. Protected routes, Zod request validation and rate limiting guard the API.',
        ],
        [
          'API design',
          'Express routes are organised by resource (auth, products, categories, cart, wishlist, orders, admin), each with its own controller and Sequelize models.',
        ],
        [
          'Interface',
          'React Router pages for the storefront and admin, Axios for API calls, Framer Motion for animation and toast notifications for feedback.',
        ],
        [
          'Deployment',
          'Includes a deployment guide for Azure App Service and Azure Database for MySQL, and a Vercel configuration for the frontend.',
        ],
      ],
      stack: ['React', 'Vite', 'Node.js', 'Express', 'MySQL', 'Sequelize', 'JWT', 'bcrypt', 'Zod'],
      links: [['View source on GitHub', `${GH}/Shopping-cart`]],
    },
  },
  {
    name: 'Progress in motion',
    room: 'PULSE',
    slug: 'fitness',
    short: 'Fitness',
    label: 'FULL STACK FITNESS TRACKER',
    title: 'Small steps.<br>Real <em>progress.</em>',
    intro:
      'Set a fitness goal, log what you achieve each day and watch progress against the target on a React dashboard backed by Spring Boot.',
    tags: ['SPRING BOOT', 'REACT', 'JPA', 'MYSQL'],
    action: 'Explore the project',
    demo: 'Pause / resume pulse',
    caption: 'MOVE / TRACK / REPEAT',
    detail: {
      title: 'Full Stack Fitness Tracker',
      lead: 'A goal-tracking application for workouts and daily activity, with a Spring Boot REST API and a React dashboard.',
      facts: [
        ['Type', 'Full-stack web app'],
        ['Backend', 'Spring Boot · JPA'],
        ['Frontend', 'React'],
        ['Database', 'MySQL'],
      ],
      features: [
        'Goal form for setting targets',
        'Activity log of daily entries',
        'Dashboard of progress against goals',
        'Per-user history',
      ],
      blocks: [
        [
          'Data model',
          'Each entry records the user, the goal type, the target amount, the amount achieved and the date, stored as a JPA entity in a fitness_entries table.',
        ],
        [
          'API',
          'A Spring Boot controller under /api/fitness saves new entries (POST) and returns a user’s history (GET /api/fitness/{username}), with a layered controller → service → repository design and CORS configured for the React app.',
        ],
        ['Interface', 'React components for the home page, goal form, activity log and dashboard.'],
      ],
      stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'Lombok', 'React', 'MySQL'],
      links: [['View source on GitHub', `${GH}/fitness_goal_tracker`]],
    },
  },
  {
    name: 'The lab',
    room: 'THE LAB',
    slug: 'lab',
    short: 'Lab',
    label: 'AI · DATA · TESTING',
    title: 'Curious about<br><em>everything.</em>',
    intro:
      'Work beyond web apps: an image classifier trained with transfer learning, a Power BI marketing dashboard and an automated browser test suite.',
    tags: ['TENSORFLOW', 'POWER BI', 'SELENIUM', 'TESTNG'],
    action: 'Open the lab notes',
    demo: 'Run the test suite',
    caption: 'THE LAB / TRAIN · MEASURE · TEST',
    detail: {
      title: 'The lab',
      lead: 'Three projects that stretch past full-stack development into machine learning, analytics and quality assurance.',
      blocks: [
        [
          'Animal image classifier',
          'A multi-class image classifier built with TensorFlow and Keras on a ResNet50 backbone. Training runs in two phases: first the new classification head, then fine-tuning of the last layers at a lower learning rate, with early stopping and checkpointing of the best model.',
        ],
        [
          'Marketing campaign dashboard',
          'A Power BI report that measures how effective marketing campaigns are, turning raw campaign data into visuals that are easy to compare.',
        ],
        [
          'Automated testing',
          'A Maven project that drives a browser with Selenium WebDriver and runs the scenarios with TestNG, producing Surefire test reports.',
        ],
        [
          'In this room',
          'Use “Run the test suite” to light up the test grid, one passing check at a time.',
        ],
      ],
      stack: [
        'Python',
        'TensorFlow',
        'Keras',
        'ResNet50',
        'Power BI',
        'Selenium',
        'TestNG',
        'Maven',
      ],
      links: [
        ['Image classifier', `${GH}/Image_Based_Animal_Type_Classification`],
        ['Power BI dashboard', `${GH}/Marketing-Campa.ign-Effectiveness-Dashboard---PowerBI`],
        ['Test automation', `${GH}/Software-testing`],
      ],
    },
  },
  {
    name: 'Learning by building',
    room: 'TRAJECTORY',
    slug: 'experience',
    short: 'Experience',
    label: 'EXPERIENCE & CREDENTIALS',
    title: 'Always learning.<br>Always <em>building.</em>',
    intro:
      'Two industry internships, a degree in progress and certifications in Java, data structures and data analytics.',
    tags: ['HCL INFOSYSTEMS', 'MIST SOFTWARE', 'SKCET'],
    action: 'Experience & credentials',
    caption: 'CRAFT / COMPOUNDING',
    detail: {
      title: 'The journey so far',
      lead: 'Education, internships and certifications, most recent first.',
      timeline: [
        ['May – Jun 2026', 'HCL Infosystems', 'Java Full Stack Internship'],
        ['Jun – Jul 2025', 'Mist Software Solutions', 'Internship'],
        ['2023 – 2027', 'SKCET', 'B.Tech Information Technology'],
      ],
      blocks: [
        [
          'Certifications',
          'Infosys Springboard: Java and Data Structures. Udemy: Advanced Excel for Data Analytics. Accenture: iAspire Achievement Certification.',
        ],
        [
          'Foundations',
          'Object-oriented programming, data structures and algorithms, database management systems and software testing.',
        ],
      ],
    },
  },
  {
    name: 'The next chapter',
    room: 'PORTAL',
    slug: 'contact',
    short: 'Contact',
    label: 'LET’S BUILD SOMETHING',
    title: 'Every great build<br>starts with <em>hello.</em>',
    intro:
      'Have a project, an internship, a role or just a question? Step through the portal and say hello.',
    tags: ['EMAIL', 'GITHUB', 'LINKEDIN'],
    action: 'Let’s connect',
    caption: 'YOUR IDEA / THE NEXT BUILD',
    detail: {
      title: 'Let’s connect',
      lead: 'A project, an internship, a role, or a conversation about building useful software.',
      facts: [
        ['Email', 'jeisurya624@gmail.com'],
        ['GitHub', 'github.com/jeisurya15'],
        ['LinkedIn', 'linkedin.com/in/jeisurya15'],
      ],
      blocks: [],
      contact: true,
    },
  },
];
