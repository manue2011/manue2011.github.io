// Contenido del portafolio. Edita aquí para añadir o cambiar proyectos.
const GITHUB_USER = 'manue2011';

const SKILL_BARS = [
  { name: 'Backend', value: 85, color: 'lime' },
  { name: 'Bases de datos', value: 80, color: 'cyan' },
  { name: 'Frontend', value: 70, color: 'pink' },
  { name: 'DevOps / Deploy', value: 60, color: 'yellow' },
];

const INVENTORY = [
  'JavaScript', 'Python', 'Java', 'PHP', 'HTML', 'CSS',
  'React', 'Node.js', 'Express', 'Symfony', 'Twig', 'Doctrine',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'Linux',
];

// difficulty: 1-5 estrellas. lang: se usa para los filtros.
const PROJECTS = [
  {
    id: 'Conexion_Animal',
    title: 'Conexión Animal',
    boss: true,
    lang: 'JavaScript',
    difficulty: 5,
    summary: 'Plataforma SaaS full-stack que digitaliza la gestión de protectoras de animales y colonias felinas. Proyecto final de DAW.',
    loot: [
      'Portal público de adopciones con filtros',
      'Roles (superadmin, admin, gestor, user) con JWT',
      'Alertas urgentes por email vía Gmail API (OAuth 2.0)',
      'Modelo freemium con Stripe y dashboard de KPIs',
    ],
    stack: ['React 18', 'Node.js', 'Express', 'PostgreSQL', 'Stripe', 'Vercel', 'Render'],
    demo: 'https://conexion-animal-bice.vercel.app',
  },
  {
    id: 'bot',
    title: 'CryptoBot Ultra',
    lang: 'JavaScript',
    difficulty: 4,
    status: 'En desarrollo',
    summary: 'Bot de trading algorítmico que caza tendencias con un sistema de puntuación multivariable y gestión de riesgo.',
    stack: ['Node.js', 'Binance API', 'RSI · MACD · SMA', 'IA de noticias', 'Fly.io'],
  },
  {
    id: 'Auditoria_Nominas',
    title: 'Auditoría de Nóminas',
    lang: 'Python',
    difficulty: 4,
    summary: 'App de escritorio que cruza ficheros de operaciones, IRPF, costes y remesas para detectar anomalías en nóminas según umbrales por centro.',
    stack: ['Python', 'Tkinter', 'Excel', 'JSON config'],
  },
  {
    id: 'gescon',
    title: 'Gescon',
    lang: 'JavaScript',
    difficulty: 3,
    summary: 'API REST con arquitectura por capas (controller · service · repository), tests y pipeline CI/CD que publica la imagen en Docker Hub.',
    stack: ['Express 5', 'Sequelize', 'MySQL', 'Jest', 'Docker', 'GitHub Actions'],
  },
  {
    id: 'symfony-blog-app',
    title: 'Symfony Blog',
    lang: 'PHP',
    difficulty: 3,
    summary: 'Blog con autenticación por roles, panel de administración, comentarios, categorías, buscador y paginación.',
    stack: ['PHP 8', 'Symfony 5.4', 'Doctrine', 'Twig', 'MySQL'],
  },
  {
    id: 'crud-videojuegos-clase',
    title: 'Videojuegos Retro',
    lang: 'JavaScript',
    difficulty: 2,
    summary: 'CRUD full-stack para gestionar una colección de videojuegos clásicos, desplegado en la nube.',
    stack: ['Node.js', 'Express', 'PostgreSQL', 'Bootstrap 5', 'Render'],
    demo: 'https://videojuegos-retro-manu.onrender.com/',
  },
  {
    id: 'Biblioteca_Local',
    title: 'Biblioteca Local',
    lang: 'JavaScript',
    difficulty: 2,
    summary: 'Gestión de biblioteca con MVC, roles, contraseñas cifradas y búsqueda en la API pública de OpenLibrary.',
    stack: ['Node.js', 'Express', 'MySQL', 'bcrypt', 'OpenLibrary API'],
  },
  {
    id: 'tienda_online_php',
    title: 'Tienda Online',
    lang: 'PHP',
    difficulty: 2,
    summary: 'Tienda con búsqueda avanzada de productos, login de usuarios y gestión de perfil contra MySQL.',
    stack: ['PHP', 'MySQL', 'HTML', 'CSS'],
  },
  {
    id: 'nodejs_proyecto',
    title: 'API Telefonía',
    lang: 'JavaScript',
    difficulty: 1,
    summary: 'API REST con rutas y controladores para consultar empresas de telecomunicaciones en MySQL.',
    stack: ['Node.js', 'Express', 'MySQL'],
  },
  {
    id: 'LIGAV2',
    title: 'Liga V2',
    lang: 'Java',
    difficulty: 1,
    summary: 'Simulador de liga de fútbol con POO: jugadores, entrenadores, equipos y posiciones con enums.',
    stack: ['Java', 'POO'],
  },
];
