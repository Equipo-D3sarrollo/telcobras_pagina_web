import type { LanguagePreference } from "@/lib/accessibility-preferences";

type ServiceId = "conectividad" | "seguridad" | "colaboracion" | "nube" | "agentes-ia";
type ProjectId =
  | "vigilancia-risaralda"
  | "chatbot-espy"
  | "automatizacion-agua-cali"
  | "zonas-wifi-corregimientos"
  | "nodos-telemetria-cali"
  | "centros-digitales-claro";
type ValueId =
  | "compromiso"
  | "integridad"
  | "innovacion"
  | "colaboracion"
  | "responsabilidadSocial"
  | "aprendizajeContinuo"
  | "empatia";
type DifferenceId =
  | "instalacion-15-dias"
  | "soporte-24-7"
  | "acompanamiento-cercano"
  | "soluciones-a-la-medida"
  | "compromiso-integridad";

interface Catalog {
  cookieBanner: {
    label: string;
    description: string;
    privacyLink: string;
    acceptAll: string;
    rejectNonEssential: string;
    configure: string;
    preferencesTitle: string;
    essentialCookies: string;
    essentialDescription: string;
    nonEssentialCookies: string;
    nonEssentialDescription: string;
    back: string;
    savePreferences: string;
    storageError: string;
  };
  accessibility: {
    open: string;
    close: string;
    title: string;
    theme: string;
    system: string;
    light: string;
    dark: string;
    fontSize: string;
    normal: string;
    large: string;
    larger: string;
    largest: string;
    colorblind: string;
    colorblindDescription: string;
    language: string;
    spanish: string;
    english: string;
    reset: string;
  };
  navigation: {
    links: string[];
    support: string;
    noc: string;
    quote: string;
    openMenu: string;
    closeMenu: string;
    mainLabel: string;
    mobileLabel: string;
    backToTop: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    requestAdvice: string;
    exploreServices: string;
    slogan: string;
    imageLabel: string;
    networkInfrastructure: string;
    fiberMicrowave: string;
    metrics: [
      { value: string; description: string },
      { value: string; description: string },
      { value: string; description: string },
      { value: string; description: string },
    ];
  };
  about: {
    eyebrow: string;
    title: string;
    heading: string;
    description: string;
    coreValue: string;
    coreDescription: string;
    mission: string;
    missionDescription: string;
    vision: string;
    visionDescription: string;
    essence: string;
    valuesTitle: string;
    valuesDescription: string;
    values: Record<ValueId, string>;
  };
  services: {
    badge: string;
    title: string;
    description: string;
    capabilities: string;
    differentiator: string;
    quoteService: string;
    availabilityTitle: string;
    availabilityDescription: string;
    supportTitle: string;
    supportDescription: string;
    installationTitle: string;
    installationDescription: string;
    active: string;
    cards: Record<
      ServiceId,
      {
        title: string;
        tagline: string;
        description: string;
        features: string[];
        badge: string;
      }
    >;
  };
  ai: {
    badge: string;
    title: string;
    description: string;
    cta: string;
    partners: string;
  };
  projects: {
    title: string;
    description: string;
    view: string;
    detail: string;
    chatbotTry: string;
    chatbotMessage: string;
    challenge: string;
    talk: string;
    talkProject: string;
    category: string;
    location: string;
    quoteSimilar: string;
    cards: Record<
      ProjectId,
      {
        title: string;
        description: string;
        longDescription?: string;
        alt: string;
        category: string;
        location?: string;
      }
    >;
  };
  why: {
    title: string;
    description: string;
    featuredTitle: string;
    featuredDescription: string;
    fiber: string;
    radio: string;
    differences: Record<DifferenceId, { title: string; description: string }>;
    ctaQuestion: string;
    cta: string;
  };
  contact: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    shortAddress: string;
    streetAddress: string;
    formTitle: string;
    formDescription: string;
    formUnavailableTitle: string;
    formUnavailableDescription: string;
    name: string;
    namePlaceholder: string;
    company: string;
    companyPlaceholder: string;
    position: string;
    positionPlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    service: string;
    serviceOptions: { value: string; label: string }[];
    details: string;
    detailsPlaceholder: string;
    consent: string;
    privacyLinkLabel: string;
    consentPointer: string;
    consentError: string;
    consentSuccess: string;
    requiredError: string;
    consentWarning: string;
    consentWarningDescription: string;
    successTitle: string;
    successDescription: string;
    successAnother: string;
    submitting: string;
    submit: string;
    submissionError: string;
    findUs: string;
    locationTitle: string;
    locationDescription: string;
    directions: string;
    footerTagline: string;
    copyright: string;
    terms: string;
    privacy: string;
    sla: string;
    logoAlt: string;
    mapTitle: string;
    whatsappLabel: string;
    whatsappMessage: string;
    socialTitle: string;
    socialLabels: {
      facebook: string;
      instagram: string;
      linkedin: string;
      tiktok: string;
    };
    legalLinksLabel: string;
    hoursLabel: string;
    cookiePreferences: string;
    turnstileRequired: string;
    tooManyRequests: string;
    turnstileFailed: string;
    turnstileLabel: string;
    turnstileRenderError: string;
    turnstileScriptError: string;
  };
  chatbot: {
    initialGreeting: string;
    title: string;
    subtitle: string;
    close: string;
    expand: string;
    restore: string;
    messageLabel: string;
    placeholder: string;
    send: string;
    open: string;
    welcomeTitle: string;
    welcomeDescription: string;
    welcomeCta: string;
    dismissWelcome: string;
    user: string;
    assistant: string;
    responding: string;
    errorTitle: string;
    errors: Record<
      | "chat_unavailable"
      | "invalid_request"
      | "invalid_upstream_response"
      | "upstream_error"
      | "upstream_timeout"
      | "agent_response_unavailable"
      | "generic"
      | "rate_limit_exceeded",
      string
    >;
    responseParseError: string;
    invalidResponse: string;
    whatsappTest: string;
  };
  errors: {
    notFoundTitle: string;
    notFoundDescription: string;
    pageErrorTitle: string;
    pageErrorDescription: string;
    retry: string;
    home: string;
    services: string;
  };
  metadata: {
    title: string;
    description: string;
    socialTitle: string;
    socialDescription: string;
  };
  chatbotProject: {
    greeting: string;
    question: string;
    assistant: string;
  };
}

const es: Catalog = {
  cookieBanner: {
    label: "Preferencias de cookies",
    description:
      "Utilizamos cookies para mejorar tu experiencia en nuestro sitio web. Al navegar por este sitio web, aceptas el uso de cookies. Más información en nuestra",
    privacyLink: "Política de privacidad",
    acceptAll: "Aceptar todas",
    rejectNonEssential: "Rechazar las no esenciales",
    configure: "Configurar preferencias",
    preferencesTitle: "Configurar preferencias de cookies",
    essentialCookies: "Cookies esenciales",
    essentialDescription: "Necesarias para que el sitio web funcione.",
    nonEssentialCookies: "Cookies no esenciales",
    nonEssentialDescription: "Permiten guardar preferencias opcionales de cookies.",
    back: "Volver",
    savePreferences: "Guardar preferencias",
    storageError: "No se pudo guardar tu preferencia. Inténtalo de nuevo.",
  },
  accessibility: {
    open: "Abrir opciones de accesibilidad",
    close: "Cerrar opciones de accesibilidad",
    title: "Accesibilidad",
    theme: "Apariencia",
    system: "Automática (sistema)",
    light: "Claro",
    dark: "Oscuro",
    fontSize: "Tamaño del texto",
    normal: "Normal (100 %)",
    large: "Grande (125 %)",
    larger: "Muy grande (150 %)",
    largest: "Máxima (200 %)",
    colorblind: "Modo daltonismo",
    colorblindDescription:
      "Resalta enlaces y selecciones con subrayados, marcas y formas, sin alterar imágenes ni videos.",
    language: "Idioma",
    spanish: "Español",
    english: "Inglés",
    reset: "Restablecer opciones",
  },
  navigation: {
    links: [
      "Inicio",
      "Quiénes Somos",
      "Servicios",
      "Inteligencia Artificial",
      "Proyectos",
      "¿Por qué TELCOBRAS?",
      "Ubicación",
      "Contacto",
    ],
    support: "Soporte Técnico",
    noc: "NOC Especializado",
    quote: "Solicita una cotización",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    mainLabel: "Navegación principal",
    mobileLabel: "Navegación móvil",
    backToTop: "Volver al inicio",
  },
  hero: {
    eyebrow: "Sede Principal en Cali • Cobertura Nacional en Colombia",
    title: "Tecnología que",
    highlight: "transforma procesos",
    description:
      "Integramos tecnología, conectividad e Inteligencia Artificial para crear soluciones adaptadas a cada organización.",
    requestAdvice: "Solicitar Asesoría Personalizada",
    exploreServices: "Explorar Servicios",
    slogan: "«Una nueva forma de entender las redes»",
    imageLabel: "Infraestructura tecnológica de TELCOBRAS",
    networkInfrastructure: "Infraestructura de Red Propia",
    fiberMicrowave: "Fibra Óptica y Microondas en Cali y Colombia",
    metrics: [
      { value: "+20 años", description: "De experiencia y trayectoria" },
      { value: "99,6 %", description: "Disponibilidad SLA garantizada" },
      { value: "15 días", description: "Instalación rápida y eficiente" },
      { value: "24/7", description: "Soporte e ingeniería especializada" },
    ],
  },
  about: {
    eyebrow: "Conectividad · Innovación · Confianza",
    title: "Quiénes Somos",
    heading:
      "El aliado tecnológico de confianza para las empresas que buscan crecer, transformarse y mantenerse vigentes",
    description:
      "Somos una compañía colombiana con sede principal en Cali y más de 20 años de experiencia comprobada. Desarrollamos soluciones integrales de tecnología y telecomunicaciones con infraestructura propia de fibra óptica y radioenlace de microondas, además de integrar Inteligencia Artificial en procesos clave. Atendemos a empresas medianas y grandes que exigen continuidad, seguridad y desempeño superior.",
    coreValue: "Nuestro valor central: la confianza",
    coreDescription:
      "Cada enlace, cada servicio en la nube y cada despliegue de seguridad lo respaldamos con cercanía, honestidad técnica y cumplimiento estricto de los acuerdos de servicio.",
    mission: "Misión",
    missionDescription:
      "Colaborar con las organizaciones como aliados estratégicos en la implementación de soluciones tecnológicas que impulsen sus objetivos y generen un impacto positivo mediante la adopción efectiva de las TIC.",
    vision: "Visión",
    visionDescription:
      "Ser líderes en tecnologías de la información y comunicación en Latinoamérica, destacándonos por la apropiación tecnológica y el desarrollo sostenible de nuestros aliados.",
    essence: "Nuestra esencia",
    valuesTitle: "Valores que nos mueven",
    valuesDescription:
      "Principios que guían cada relación, cada decisión y cada solución que construimos.",
    values: {
      compromiso: "Compromiso",
      integridad: "Integridad",
      innovacion: "Innovación",
      colaboracion: "Colaboración",
      responsabilidadSocial: "Responsabilidad Social",
      aprendizajeContinuo: "Aprendizaje Continuo",
      empatia: "Empatía",
    },
  },
  services: {
    badge: "Portafolio de Servicios",
    title: "Soluciones integradas para la continuidad de tu negocio",
    description:
      "Combinamos infraestructura de última generación, plataformas digitales seguras e Inteligencia Artificial.",
    capabilities: "Capacidades y características:",
    differentiator: "Valor diferencial",
    quoteService: "Cotizar {service} para tu empresa",
    availabilityTitle: "Alta disponibilidad:",
    availabilityDescription: "Disponibilidad de red del 99,6 %.",
    supportTitle: "Soporte continuo:",
    supportDescription: "Atención 24/7 con ingeniería especializada.",
    installationTitle: "Instalación en 15 días:",
    installationDescription: "Agilidad de implementación para no retrasar tu operación.",
    active: "En pantalla",
    cards: {
      conectividad: {
        title: "Conectividad de Alta Disponibilidad",
        tagline:
          "Internet dedicado y banda ancha sobre fibra óptica propia y radioenlace de microondas.",
        description:
          "Diseñamos e implementamos redes robustas para garantizar que las operaciones de tu empresa nunca se detengan, respaldadas por disponibilidad de red del 99,6 %.",
        features: [
          "Internet dedicado corporativo",
          "Red SD-WAN para optimización inteligente de tráfico",
          "Enlaces de datos punto a punto y multipunto corporativos",
          "Infraestructura Wi-Fi administrada",
          "Redundancia automática",
        ],
        badge: "Infraestructura propia",
      },
      seguridad: {
        title: "Seguridad Integral y Ciberdefensa",
        tagline: "Protección perimetral y digital sincronizada contra amenazas emergentes.",
        description:
          "Resguardamos la información sensible y la continuidad operacional de tu negocio mediante arquitecturas avanzadas de firewall de próxima generación y monitoreo continuo.",
        features: [
          "Seguridad sincronizada y monitoreo inteligente de red",
          "Control unificado desde un único dispositivo centralizado",
          "Análisis predictivo de ciberamenazas e intromisiones",
          "Protección anti-DDoS avanzada de mitigación en tiempo real",
          "Auditoría y cumplimiento de estándares internacionales",
        ],
        badge: "Protección sincronizada",
      },
      colaboracion: {
        title: "Colaboración y Comunicaciones Unificadas",
        tagline: "Conecta a tus equipos sin importar dónde se encuentren, con movilidad total.",
        description:
          "Soluciones que impulsan el trabajo híbrido con telefonía IP corporativa, videoconferencia en alta definición y plataformas integradas de mensajería.",
        features: [
          "Plataforma integral para teletrabajo y movilidad corporativa",
          "Salas virtuales e integración de audioconferencias HD",
          "Centrales telefónicas IP administradas en la nube",
          "Mensajería unificada con presencia y estado en tiempo real",
          "Integración transparente con plataformas Microsoft y CRM",
        ],
        badge: "Trabajo híbrido",
      },
      nube: {
        title: "Nube Híbrida",
        tagline: "Infraestructura flexible, escalable y segura disponible 24/7/365.",
        description:
          "Aceleramos tu migración digital combinando la agilidad de la nube con el control de tu propia infraestructura, respaldada por ingeniería especializada.",
        features: [
          "Nube híbrida personalizada para cargas de trabajo críticas",
          "Almacenamiento y respaldos automatizados (respaldo y recuperación ante desastres)",
          "Disponibilidad de red del 99,6 %",
          "Soporte 24/7 con ingeniería especializada",
          "Optimización de costos operativos de TI",
        ],
        badge: "Escalabilidad total",
      },
      "agentes-ia": {
        title: "Agentes con Inteligencia Artificial",
        tagline: "Soluciones de IA para automatizar procesos y potenciar tu operación.",
        description:
          "Implementamos soluciones de Inteligencia Artificial para automatizar procesos, fortalecer la atención al cliente y generar nuevas oportunidades comerciales.",
        features: [
          "Automatización de procesos operativos y de negocio",
          "Atención inteligente y automatizada al cliente",
          "Generación y gestión de oportunidades comerciales",
          "Integración con tus sistemas y canales actuales",
          "Análisis de datos para la toma de decisiones",
        ],
        badge: "Inteligencia Artificial",
      },
    },
  },
  ai: {
    badge: "Inteligencia Artificial",
    title: "Inteligencia Artificial integrada a tus procesos",
    description:
      "Integramos tecnología, conectividad e Inteligencia Artificial para ayudar a las empresas a optimizar sus procesos, mejorar la atención y potenciar sus resultados. Diseñamos soluciones adaptadas a las necesidades de cada organización, desde la automatización y la telemetría hasta la atención inteligente de clientes.",
    cta: "Conversemos sobre tu proyecto",
    partners: "Alianzas y Ecosistema Tecnológico",
  },
  projects: {
    title: "Proyectos que respaldan nuestra experiencia",
    description:
      "Conectividad, telemetría, seguridad e inteligencia artificial implementadas en Colombia.",
    view: "Ver proyecto",
    detail: "Ver detalle del proyecto: {title}",
    chatbotTry: "Prueba el chatbot de la ESPY por WhatsApp",
    chatbotMessage: "Hola, quiero probar el chatbot de la ESPY",
    challenge: "¿Tienes un reto similar?",
    talk: "Hablemos",
    talkProject: "Hablemos de tu proyecto",
    category: "Categoría",
    location: "Ubicación",
    quoteSimilar: "Cotizar algo similar",
    cards: {
      "vigilancia-risaralda": {
        title: "Vigilancia y mitigación de amenazas y riesgos en el municipio de Risaralda",
        description:
          "Vigilancia y mitigación de amenazas y riesgos en el municipio de Risaralda, con despliegue de monitoreo sobre infraestructura de telecomunicaciones.",
        alt: "Técnicos trabajando en una torre de telecomunicaciones en Risaralda",
        category: "Seguridad y monitoreo",
        location: "Risaralda",
      },
      "chatbot-espy": {
        title: "Chatbot para la ESPY",
        description:
          "Solución de atención automatizada para las necesidades de la entidad, mediante un asistente conversacional integrado.",
        alt: "Ilustración de un asistente virtual para la ESPY",
        category: "Inteligencia Artificial",
      },
      "automatizacion-agua-cali": {
        title: "Automatización de plantas de tratamiento de agua en Cali",
        description:
          "Automatización, control e instalación de controladores y sensores de variables de agua integrados por telemetría, para mejorar el servicio de agua potable a la comunidad.",
        alt: "Planta industrial de tratamiento de agua en Cali",
        category: "Automatización y telemetría",
        location: "Cali",
      },
      "zonas-wifi-corregimientos": {
        title: "Zonas Wi-Fi gratuitas en parques principales de corregimientos del país",
        description:
          "Instalación y puesta en marcha del proyecto insignia de gobierno de Internet para todos.",
        alt: "Persona usando su celular en un parque con zona Wi-Fi gratuita",
        category: "Conectividad",
        location: "Corregimientos del país",
      },
      "nodos-telemetria-cali": {
        title: "Nodos de telemetría en Santiago de Cali",
        description:
          "Instalación de sensores LoRaWAN para la automatización y gestión de la energía en luminarias de alumbrado público.",
        alt: "Alumbrado público nocturno en Santiago de Cali",
        category: "Telemetría IoT",
        location: "Santiago de Cali",
      },
      "centros-digitales-claro": {
        title: "Centros Digitales Claro",
        description: "Instalación de zonas Wi-Fi en escuelas de zonas rurales.",
        alt: "Estudiantes con dispositivos en una escuela rural",
        category: "Conectividad",
        location: "Zonas rurales",
      },
    },
  },
  why: {
    title: "¿Por qué TELCOBRAS S.A.S.?",
    description: "Razones concretas por las que las organizaciones confían en nuestras soluciones.",
    featuredTitle: "Red Propia y Redundante",
    featuredDescription:
      "Fibra óptica y radioenlace de microondas propios: autonomía y respuesta inmediata, sin intermediarios.",
    fiber: "Fibra óptica",
    radio: "Radioenlace",
    differences: {
      "instalacion-15-dias": {
        title: "Instalación en 15 días",
        description:
          "Desplegamos sobre nuestra propia red, sin depender de terceros, para que tu empresa opere sin demoras.",
      },
      "soporte-24-7": {
        title: "Soporte técnico 24/7",
        description:
          "Ingeniería especializada y NOC que atienden cada evento de forma oportuna y proactiva.",
      },
      "acompanamiento-cercano": {
        title: "Acompañamiento cercano",
        description:
          "Un equipo asignado que entiende la realidad y las metas operativas de tu organización.",
      },
      "soluciones-a-la-medida": {
        title: "Soluciones a la medida",
        description:
          "Arquitectura de red y ciberseguridad diseñada según el tamaño, presupuesto y crecimiento de tu empresa.",
      },
      "compromiso-integridad": {
        title: "Compromiso e integridad",
        description:
          "Nuestro valor primordial es la confianza de las organizaciones que eligen nuestras soluciones.",
      },
    },
    ctaQuestion: "¿Quieres conocer nuestra red?",
    cta: "Hablemos",
  },
  contact: {
    badge: "Atención inmediata para empresas",
    title: "Hablemos de las necesidades",
    titleHighlight: "tecnológicas de tu empresa",
    description:
      "Completa el formulario y un asesor técnico especializado se pondrá en contacto contigo para conversar sobre tu proyecto.",
    phone: "Línea de atención comercial",
    email: "Correo electrónico directo",
    address: "Sede principal corporativa",
    shortAddress: "Carrera 83A # 20 - 20, Cali, Colombia",
    streetAddress: "Carrera 83A # 20 - 20, Cali, Valle del Cauca",
    formTitle: "Solicitud de cotización o diagnóstico",
    formDescription: "Ingresa tus datos corporativos para entregarte una propuesta a la medida.",
    formUnavailableTitle: "Formulario no disponible temporalmente",
    formUnavailableDescription:
      "No podemos recibir solicitudes en este momento. Escríbenos a {email} mientras restablecemos el servicio.",
    name: "Nombre completo *",
    namePlaceholder: "Ej. Carlos Mendoza",
    company: "Nombre de la empresa",
    companyPlaceholder: "Ej. Grupo Industrial S.A.",
    position: "Cargo en la empresa",
    positionPlaceholder: "Ej. Director de TI / Gerente de Operaciones",
    emailLabel: "Correo electrónico *",
    emailPlaceholder: "carlos@tuempresa.com",
    phoneLabel: "Teléfono / WhatsApp *",
    phonePlaceholder: "+57 300 000 0000",
    service: "Servicio de interés",
    serviceOptions: [
      { value: "Conectividad (Fibra & Radioenlace)", label: "Conectividad (fibra y radioenlace)" },
      {
        value: "Seguridad Sincronizada & Ciberdefensa",
        label: "Seguridad sincronizada y ciberdefensa",
      },
      { value: "Colaboración & Trabajo Híbrido", label: "Colaboración y trabajo híbrido" },
      { value: "Nube Híbrida & Almacenamiento", label: "Nube híbrida y almacenamiento" },
      { value: "Inteligencia Artificial integrada", label: "Inteligencia Artificial integrada" },
      {
        value: "Agentes con Inteligencia Artificial",
        label: "Agentes con Inteligencia Artificial",
      },
      { value: "Solución Integral a la Medida", label: "Solución integral a la medida" },
    ],
    details: "Detalles de tu requerimiento",
    detailsPlaceholder:
      "Cuéntanos brevemente la ubicación, sedes o necesidades técnicas de tu empresa...",
    consent:
      "He leído la Política de Tratamiento de Datos Personales de TELCOBRAS S.A.S. y autorizo el tratamiento de mis datos personales de conformidad con la Ley 1581 de 2012.",
    privacyLinkLabel: "Consultar política de tratamiento de datos",
    consentPointer: "Marca aquí ↓",
    consentError:
      "Para proteger tu información necesitamos tu autorización. Marca la casilla y vuelve a enviar: ¡estás a un clic de tu cotización!",
    consentSuccess: "¡Perfecto! Ya puedes enviar tu solicitud.",
    requiredError: "Por favor, completa los campos obligatorios.",
    consentWarning: "¡Casi listo! Falta un paso",
    consentWarningDescription:
      "Marca la casilla de autorización de tratamiento de datos para enviar tu solicitud.",
    successTitle: "¡Solicitud recibida!",
    successDescription:
      "Hemos asignado tu requerimiento a nuestro equipo de ingeniería comercial. Te contactaremos al teléfono indicado o a tu correo corporativo en menos de 24 horas.",
    successAnother: "Enviar otra consulta",
    submitting: "Enviando...",
    submit: "Enviar solicitud de cotización",
    submissionError:
      "No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos a {email} o por WhatsApp.",
    findUs: "Encuéntranos",
    locationTitle: "¿Dónde estamos?",
    locationDescription: "Visítanos en nuestra sede principal en Cali.",
    directions: "Cómo llegar",
    footerTagline: "Innovación • Compromiso • Resultados",
    copyright: "{company} | NIT {nit} © {year} — Todos los derechos reservados.",
    terms: "Términos de Servicio",
    privacy: "Política de tratamiento de datos",
    sla: "SLA y garantías",
    logoAlt: "Logotipo de TELCOBRAS S.A.S.",
    mapTitle: "Ubicación de TELCOBRAS S.A.S. en Cali",
    whatsappLabel: "Contáctanos por WhatsApp",
    whatsappMessage: "Hola, quiero información sobre los servicios de TELCOBRAS",
    socialTitle: "Síguenos en redes sociales:",
    socialLabels: {
      facebook: "TELCOBRAS en Facebook",
      instagram: "TELCOBRAS en Instagram",
      linkedin: "TELCOBRAS en LinkedIn",
      tiktok: "TELCOBRAS en TikTok",
    },
    legalLinksLabel: "Enlaces legales",
    hoursLabel: "Horario de atención",
    cookiePreferences: "Preferencias de cookies",
    turnstileRequired: "Por favor complete la verificación de seguridad.",
    tooManyRequests:
      "Has realizado demasiados intentos. Por favor espera unos minutos antes de volver a intentar.",
    turnstileFailed: "La verificación de seguridad falló. Por favor intente nuevamente.",
    turnstileLabel: "Verificación de seguridad Cloudflare Turnstile",
    turnstileRenderError: "No se pudo inicializar la verificación de seguridad.",
    turnstileScriptError: "Error al cargar el script de verificación.",
  },
  chatbot: {
    initialGreeting: "¡Hola! Soy el asistente de TELCOBRAS. ¿En qué puedo ayudarte?",
    title: "Asistente TELCOBRAS",
    subtitle: "Estamos aquí para ayudarte",
    close: "Cerrar chat",
    expand: "Ampliar ventana del chat",
    restore: "Restaurar tamaño del chat",
    messageLabel: "Escribe tu mensaje",
    placeholder: "Escribe tu mensaje...",
    send: "Enviar mensaje",
    open: "Abrir asistente TELCOBRAS",
    welcomeTitle: "¡Hola! ¿Necesitas ayuda?",
    welcomeDescription: "Estoy aquí para ayudarte.",
    welcomeCta: "Hablemos →",
    dismissWelcome: "Cerrar saludo",
    user: "Tú",
    assistant: "Asistente",
    responding: "El asistente está respondiendo…",
    errorTitle: "Error del asistente",
    errors: {
      chat_unavailable: "El chat no está disponible por el momento. Intenta más tarde.",
      invalid_request: "No se pudo enviar el mensaje. Revisa el texto e inténtalo de nuevo.",
      invalid_upstream_response:
        "El asistente recibió una respuesta inesperada. Intenta de nuevo más tarde.",
      upstream_error: "No logramos conectar con el asistente. Intenta de nuevo en un momento.",
      upstream_timeout: "El asistente está tardando en responder. Intenta de nuevo.",
      agent_response_unavailable:
        "Make recibió tu mensaje, pero el escenario todavía no devuelve la respuesta del asistente. Revisa el módulo Webhook response.",
      generic: "No se pudo enviar el mensaje. Intenta de nuevo.",
      rate_limit_exceeded:
        "Has enviado muchos mensajes seguidos. Espera unos minutos e inténtalo de nuevo.",
    },
    responseParseError: "El servidor devolvió una respuesta que no se pudo interpretar.",
    invalidResponse: "El asistente devolvió una respuesta con un formato no válido.",
    whatsappTest: "Prueba el chatbot de la ESPY por WhatsApp",
  },
  errors: {
    notFoundTitle: "Página no encontrada",
    notFoundDescription: "La página que buscas no existe o se ha movido.",
    pageErrorTitle: "No se pudo cargar esta página",
    pageErrorDescription:
      "Se produjo un error. Puedes volver a intentarlo o regresar a la página principal.",
    retry: "Intentar de nuevo",
    home: "Ir al inicio",
    services: "Ver servicios",
  },
  metadata: {
    title: "Conectividad, ciberseguridad e IA para empresas | TELCOBRAS",
    description:
      "Conectividad, ciberseguridad, colaboración, nube híbrida e inteligencia artificial para empresas en Cali y Colombia, con soporte 24/7 y NOC especializado.",
    socialTitle: "TELCOBRAS S.A.S. | Conectividad, Ciberseguridad e IA",
    socialDescription:
      "El aliado tecnológico de confianza para empresas en crecimiento y transformación digital.",
  },
  chatbotProject: {
    greeting: "¡HOLA!",
    question: "¿Cómo puedo ayudarte hoy?",
    assistant: "¡Soy tu asistente virtual!",
  },
};

const en: Catalog = {
  cookieBanner: {
    label: "Cookie preferences",
    description:
      "We use cookies to improve your experience on our website. By browsing this website, you accept the use of cookies. Learn more in our",
    privacyLink: "Privacy Policy",
    acceptAll: "Accept all",
    rejectNonEssential: "Reject non-essential",
    configure: "Configure preferences",
    preferencesTitle: "Configure cookie preferences",
    essentialCookies: "Essential cookies",
    essentialDescription: "Required for the website to function.",
    nonEssentialCookies: "Non-essential cookies",
    nonEssentialDescription: "Allow optional cookie preferences to be saved.",
    back: "Back",
    savePreferences: "Save preferences",
    storageError: "Your preference could not be saved. Please try again.",
  },
  accessibility: {
    open: "Open accessibility options",
    close: "Close accessibility options",
    title: "Accessibility",
    theme: "Appearance",
    system: "Automatic (system)",
    light: "Light",
    dark: "Dark",
    fontSize: "Text size",
    normal: "Normal (100%)",
    large: "Large (125%)",
    larger: "Very large (150%)",
    largest: "Maximum (200%)",
    colorblind: "Color blindness mode",
    colorblindDescription:
      "Highlights links and selections with underlines, markers, and shapes without altering images or videos.",
    language: "Language",
    spanish: "Spanish",
    english: "English",
    reset: "Reset options",
  },
  navigation: {
    links: [
      "Home",
      "About Us",
      "Services",
      "Artificial Intelligence",
      "Projects",
      "Why TELCOBRAS?",
      "Location",
      "Contact",
    ],
    support: "Technical Support",
    noc: "Specialized NOC",
    quote: "Request a Quote",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainLabel: "Main navigation",
    mobileLabel: "Mobile navigation",
    backToTop: "Back to top",
  },
  hero: {
    eyebrow: "Headquartered in Cali • Nationwide coverage across Colombia",
    title: "Technology that",
    highlight: "transforms processes",
    description:
      "We bring together technology, connectivity, and Artificial Intelligence to create solutions tailored to every organization.",
    requestAdvice: "Request a Personalized Consultation",
    exploreServices: "Explore Services",
    slogan: "“A new way to understand networks”",
    imageLabel: "TELCOBRAS technology infrastructure",
    networkInfrastructure: "Our Own Network Infrastructure",
    fiberMicrowave: "Fiber Optics and Microwave Links in Cali and Colombia",
    metrics: [
      { value: "20+ years", description: "Of experience and proven track record" },
      { value: "99.6%", description: "Guaranteed SLA availability" },
      { value: "15 days", description: "Fast and efficient installation" },
      { value: "24/7", description: "Specialized engineering and support" },
    ],
  },
  about: {
    eyebrow: "Connectivity · Innovation · Trust",
    title: "About Us",
    heading:
      "The trusted technology partner for companies looking to grow, transform, and stay ahead",
    description:
      "We are a Colombian company headquartered in Cali with more than 20 years of proven experience. We develop end-to-end technology and telecommunications solutions using our own fiber-optic and microwave-link infrastructure, and integrate Artificial Intelligence into key processes. We serve mid-sized and large companies that require continuity, security, and outstanding performance.",
    coreValue: "Our core value: trust",
    coreDescription:
      "Every connection, cloud service, and security deployment is backed by close support, technical integrity, and strict compliance with service-level agreements.",
    mission: "Mission",
    missionDescription:
      "Work with organizations as strategic partners to implement technology solutions that advance their goals and create a positive impact through effective adoption of ICT.",
    vision: "Vision",
    visionDescription:
      "Become a leader in information and communications technology in Latin America, known for technology adoption and the sustainable growth of our partners.",
    essence: "What defines us",
    valuesTitle: "The values that drive us",
    valuesDescription: "Principles that guide every relationship, decision, and solution we build.",
    values: {
      compromiso: "Commitment",
      integridad: "Integrity",
      innovacion: "Innovation",
      colaboracion: "Collaboration",
      responsabilidadSocial: "Social Responsibility",
      aprendizajeContinuo: "Continuous Learning",
      empatia: "Empathy",
    },
  },
  services: {
    badge: "Our Services",
    title: "Integrated solutions for business continuity",
    description:
      "We combine next-generation infrastructure, secure digital platforms, and Artificial Intelligence.",
    capabilities: "Capabilities and features:",
    differentiator: "Key advantages",
    quoteService: "Request a quote for {service}",
    availabilityTitle: "High availability:",
    availabilityDescription: "99.6% network availability.",
    supportTitle: "Continuous support:",
    supportDescription: "24/7 support from specialized engineers.",
    installationTitle: "Installation in 15 days:",
    installationDescription: "Fast deployment so your operations aren't delayed.",
    active: "Currently displayed",
    cards: {
      conectividad: {
        title: "High-Availability Connectivity",
        tagline:
          "Dedicated internet and broadband over our own fiber-optic and microwave infrastructure.",
        description:
          "We design and deploy resilient networks to keep your business running, backed by 99.6% network availability.",
        features: [
          "Dedicated corporate internet",
          "SD-WAN for intelligent traffic optimization",
          "Corporate point-to-point and multipoint data links",
          "Managed Wi-Fi infrastructure",
          "Automatic redundancy",
        ],
        badge: "Our Own Infrastructure",
      },
      seguridad: {
        title: "Comprehensive Security and Cyber Defense",
        tagline: "Synchronized perimeter and digital protection against emerging threats.",
        description:
          "We protect sensitive information and business continuity with advanced next-generation firewall architectures and continuous monitoring.",
        features: [
          "Synchronized security and intelligent network monitoring",
          "Unified control from a single centralized device",
          "Predictive analysis of cyber threats and intrusions",
          "Advanced real-time DDoS mitigation",
          "Auditing and compliance with international standards",
        ],
        badge: "Synchronized Protection",
      },
      colaboracion: {
        title: "Unified Communications and Collaboration",
        tagline: "Connect your teams wherever they are, with complete mobility.",
        description:
          "Solutions that enable hybrid work through corporate IP telephony, high-definition video conferencing, and integrated messaging platforms.",
        features: [
          "End-to-end platform for corporate remote work and mobility",
          "Virtual meeting rooms and HD audio conferencing",
          "Cloud-managed IP phone systems",
          "Unified messaging with real-time presence and status",
          "Seamless integration with Microsoft platforms and CRMs",
        ],
        badge: "Hybrid Work",
      },
      nube: {
        title: "Hybrid Cloud",
        tagline: "Flexible, scalable, and secure infrastructure available 24/7/365.",
        description:
          "We accelerate your digital migration by combining cloud agility with control of your own infrastructure, backed by specialized engineering.",
        features: [
          "Custom hybrid cloud for critical workloads",
          "Automated storage and backup & disaster recovery",
          "99.6% network availability",
          "24/7 support from specialized engineers",
          "IT operating cost optimization",
        ],
        badge: "Total Scalability",
      },
      "agentes-ia": {
        title: "Artificial Intelligence Agents",
        tagline: "AI solutions to automate processes and enhance your operations.",
        description:
          "We implement Artificial Intelligence solutions to automate processes, improve customer service, and generate new business opportunities.",
        features: [
          "Operational and business process automation",
          "Intelligent, automated customer service",
          "Lead generation and opportunity management",
          "Integration with your existing systems and channels",
          "Data analysis for better decision-making",
        ],
        badge: "Artificial Intelligence",
      },
    },
  },
  ai: {
    badge: "Artificial Intelligence",
    title: "Artificial Intelligence integrated into your processes",
    description:
      "We bring together technology, connectivity, and Artificial Intelligence to help businesses optimize processes, improve customer service, and achieve better results. We design solutions for each organization's needs, from automation and telemetry to intelligent customer service.",
    cta: "Let's talk about your project",
    partners: "Partnerships and Technology Ecosystem",
  },
  projects: {
    title: "Projects that demonstrate our experience",
    description:
      "Connectivity, telemetry, security, and artificial intelligence solutions deployed across Colombia.",
    view: "View project",
    detail: "View project details: {title}",
    chatbotTry: "Try ESPY's chatbot on WhatsApp",
    chatbotMessage: "Hello, I'd like to try ESPY's chatbot",
    challenge: "Facing a similar challenge?",
    talk: "Let's talk",
    talkProject: "Discuss your project",
    category: "Category",
    location: "Location",
    quoteSimilar: "Request a similar solution",
    cards: {
      "vigilancia-risaralda": {
        title: "Threat and risk monitoring and mitigation in the municipality of Risaralda",
        description:
          "Threat and risk monitoring and mitigation in Risaralda, with monitoring deployed across telecommunications infrastructure.",
        alt: "Technicians working on a telecommunications tower in Risaralda",
        category: "Security and Monitoring",
        location: "Risaralda",
      },
      "chatbot-espy": {
        title: "Chatbot for ESPY",
        description:
          "Automated customer service solution tailored to the organization's needs, powered by an integrated conversational assistant.",
        alt: "Illustration of a virtual assistant for ESPY",
        category: "Artificial Intelligence",
      },
      "automatizacion-agua-cali": {
        title: "Water treatment plant automation in Cali",
        description:
          "Automation, control, and installation of controllers and water-variable sensors connected through telemetry to improve community drinking-water services.",
        alt: "Industrial water treatment plant in Cali",
        category: "Automation and Telemetry",
        location: "Cali",
      },
      "zonas-wifi-corregimientos": {
        title: "Free Wi-Fi zones in community parks across Colombia",
        description:
          "Installation and launch of a flagship public-sector project to bring internet access to everyone.",
        alt: "Person using a phone in a park with free Wi-Fi",
        category: "Connectivity",
        location: "Communities across Colombia",
      },
      "nodos-telemetria-cali": {
        title: "Telemetry nodes in Santiago de Cali",
        description:
          "Installation of LoRaWAN sensors to automate and manage energy use in public street lighting.",
        alt: "Public street lighting at night in Santiago de Cali",
        category: "IoT Telemetry",
        location: "Santiago de Cali",
      },
      "centros-digitales-claro": {
        title: "Claro Digital Centers",
        description: "Installation of Wi-Fi zones in rural schools.",
        alt: "Students using devices in a rural school",
        category: "Connectivity",
        location: "Rural Areas",
      },
    },
  },
  why: {
    title: "Why TELCOBRAS S.A.S.?",
    description: "Concrete reasons organizations trust our solutions.",
    featuredTitle: "Our Own Redundant Network",
    featuredDescription:
      "Our own fiber-optic and microwave links provide independence and immediate response, without intermediaries.",
    fiber: "Fiber optic",
    radio: "Microwave link",
    differences: {
      "instalacion-15-dias": {
        title: "Installation in 15 days",
        description:
          "We deploy over our own network, without relying on third parties, so your business can operate without delays.",
      },
      "soporte-24-7": {
        title: "24/7 Technical Support",
        description:
          "Specialized engineering and NOC teams respond to every event promptly and proactively.",
      },
      "acompanamiento-cercano": {
        title: "Personalized Partnership",
        description:
          "A dedicated team that understands your organization's needs and operational goals.",
      },
      "soluciones-a-la-medida": {
        title: "Tailored Solutions",
        description:
          "Network and cybersecurity architecture designed for your company's size, budget, and growth.",
      },
      "compromiso-integridad": {
        title: "Commitment and Integrity",
        description: "Trust is our core value and the foundation for every organization we serve.",
      },
    },
    ctaQuestion: "Want to learn about our network?",
    cta: "Let's talk",
  },
  contact: {
    badge: "Immediate business support",
    title: "Let's discuss your company's",
    titleHighlight: "technology needs",
    description:
      "Complete the form and a specialized technical advisor will contact you to discuss your project.",
    phone: "Business support line",
    email: "Direct email",
    address: "Corporate headquarters",
    shortAddress: "Carrera 83A # 20 - 20, Cali, Colombia",
    streetAddress: "Carrera 83A # 20 - 20, Cali, Valle del Cauca",
    formTitle: "Request a quote or assessment",
    formDescription: "Enter your business details and we'll prepare a tailored proposal.",
    formUnavailableTitle: "Form temporarily unavailable",
    formUnavailableDescription:
      "We can't receive requests right now. Email us at {email} while we restore the service.",
    name: "Full name *",
    namePlaceholder: "e.g., Alex Morgan",
    company: "Company name",
    companyPlaceholder: "e.g., Acme Industries Inc.",
    position: "Job title",
    positionPlaceholder: "e.g., IT Director / Operations Manager",
    emailLabel: "Email address *",
    emailPlaceholder: "alex@yourcompany.com",
    phoneLabel: "Phone / WhatsApp *",
    phonePlaceholder: "+1 555 000 0000",
    service: "Service of interest",
    serviceOptions: [
      {
        value: "Conectividad (Fibra & Radioenlace)",
        label: "Connectivity (fiber and microwave links)",
      },
      {
        value: "Seguridad Sincronizada & Ciberdefensa",
        label: "Synchronized security and cyber defense",
      },
      { value: "Colaboración & Trabajo Híbrido", label: "Collaboration and hybrid work" },
      { value: "Nube Híbrida & Almacenamiento", label: "Hybrid cloud and storage" },
      { value: "Inteligencia Artificial integrada", label: "Integrated Artificial Intelligence" },
      { value: "Agentes con Inteligencia Artificial", label: "Artificial Intelligence agents" },
      { value: "Solución Integral a la Medida", label: "Custom end-to-end solution" },
    ],
    details: "Tell us about your needs",
    detailsPlaceholder:
      "Briefly describe your locations, offices, or your company's technical needs...",
    consent:
      "I have read TELCOBRAS S.A.S.'s Personal Data Processing Policy and authorize the processing of my personal data in accordance with Law 1581 of 2012.",
    privacyLinkLabel: "View the personal data processing policy",
    consentPointer: "Check here ↓",
    consentError:
      "To protect your information, we need your authorization. Check the box and submit again—your quote is just one click away!",
    consentSuccess: "Great! You can now submit your request.",
    requiredError: "Please complete all required fields.",
    consentWarning: "Almost done! One more step",
    consentWarningDescription:
      "Check the data-processing authorization box to submit your request.",
    successTitle: "Request received!",
    successDescription:
      "We've assigned your request to our commercial engineering team. We'll contact you at the phone number or business email you provided within 24 hours.",
    successAnother: "Send another request",
    submitting: "Sending...",
    submit: "Submit quote request",
    submissionError:
      "We couldn't send your request. Please try again, email us at {email}, or contact us on WhatsApp.",
    findUs: "Find us",
    locationTitle: "Where are we?",
    locationDescription: "Visit us at our headquarters in Cali.",
    directions: "Get directions",
    footerTagline: "Innovation • Commitment • Results",
    copyright: "{company} | Tax ID {nit} © {year} — All rights reserved.",
    terms: "Terms of Service",
    privacy: "Data Privacy Policy",
    sla: "SLAs and Warranties",
    logoAlt: "TELCOBRAS S.A.S. logo",
    mapTitle: "TELCOBRAS S.A.S. location in Cali",
    whatsappLabel: "Contact us on WhatsApp",
    whatsappMessage: "Hello, I'd like information about TELCOBRAS services",
    socialTitle: "Follow us on social media:",
    socialLabels: {
      facebook: "TELCOBRAS on Facebook",
      instagram: "TELCOBRAS on Instagram",
      linkedin: "TELCOBRAS on LinkedIn",
      tiktok: "TELCOBRAS on TikTok",
    },
    legalLinksLabel: "Legal links",
    hoursLabel: "Business hours",
    cookiePreferences: "Cookie preferences",
    turnstileRequired: "Please complete the security verification.",
    tooManyRequests: "Too many requests. Please wait a few minutes before trying again.",
    turnstileFailed: "Security verification failed. Please try again.",
    turnstileLabel: "Cloudflare Turnstile security verification",
    turnstileRenderError: "The security verification could not be initialized.",
    turnstileScriptError: "The verification script failed to load.",
  },
  chatbot: {
    initialGreeting: "Hello! I'm the TELCOBRAS assistant. How can I help you?",
    title: "TELCOBRAS Assistant",
    subtitle: "We're here to help",
    close: "Close chat",
    expand: "Expand chat window",
    restore: "Restore chat size",
    messageLabel: "Type your message",
    placeholder: "Type your message...",
    send: "Send message",
    open: "Open TELCOBRAS assistant",
    welcomeTitle: "Hello! Need help?",
    welcomeDescription: "I'm here to help.",
    welcomeCta: "Let's talk →",
    dismissWelcome: "Dismiss greeting",
    user: "You",
    assistant: "Assistant",
    responding: "The assistant is responding…",
    errorTitle: "Assistant error",
    errors: {
      chat_unavailable: "Chat is temporarily unavailable. Please try again later.",
      invalid_request: "Couldn't send your message. Check it and try again.",
      invalid_upstream_response:
        "The assistant received an unexpected response. Please try again later.",
      upstream_error: "Couldn't connect to the assistant. Please try again in a moment.",
      upstream_timeout: "The assistant is taking longer than expected. Please try again.",
      agent_response_unavailable:
        "Make received your message, but the scenario hasn't returned the assistant's response yet. Check the Webhook response module.",
      generic: "Couldn't send your message. Please try again.",
      rate_limit_exceeded:
        "You've sent too many messages in a row. Please wait a few minutes and try again.",
    },
    responseParseError: "The server returned a response that couldn't be interpreted.",
    invalidResponse: "The assistant returned a response in an invalid format.",
    whatsappTest: "Try ESPY's chatbot on WhatsApp",
  },
  errors: {
    notFoundTitle: "Page not found",
    notFoundDescription: "The page you're looking for doesn't exist or may have moved.",
    pageErrorTitle: "This page couldn't load",
    pageErrorDescription: "An error occurred. Try again or return to the home page.",
    retry: "Try again",
    home: "Go to home page",
    services: "View services",
  },
  metadata: {
    title: "Connectivity, cybersecurity & AI for businesses | TELCOBRAS",
    description:
      "Connectivity, cybersecurity, collaboration, hybrid cloud and AI for businesses in Cali and Colombia, backed by 24/7 support and a specialized NOC team.",
    socialTitle: "TELCOBRAS S.A.S. | Connectivity, Cybersecurity & AI",
    socialDescription:
      "The trusted technology partner for businesses growing and transforming for the future.",
  },
  chatbotProject: {
    greeting: "HELLO!",
    question: "How can I help you today?",
    assistant: "I'm your virtual assistant!",
  },
};

export function getTranslations(language: LanguagePreference): Catalog {
  return language === "en" ? en : es;
}

export function formatLocalizedNumber(value: number, language: LanguagePreference): string {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "es-CO").format(value);
}

export function formatLocalizedDate(
  value: Date,
  language: LanguagePreference,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CO", options).format(value);
}
