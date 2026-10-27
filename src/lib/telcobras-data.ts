export const RAZON_SOCIAL = "TELCOBRAS S.A.S.";
export const NIT = "900281488-1";
export const CIUDAD = "Cali, Valle del Cauca";
export const PRIVACY_POLICY_URL = "/politica-de-privacidad";
export const TERMS_OF_SERVICE_URL = "/terminos-de-servicio";
export const SLA_URL = "/sla";

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/telcobrascolombia/",
  facebook: "https://www.facebook.com/telcobras/",
  linkedin: "https://www.linkedin.com/company/143916672/",
  tiktok: "https://www.tiktok.com/@telcobras7",
};

export const WHATSAPP_SERVICE_AVAILABLE = true;

export const SITE_URL = "https://telcobras.com";

/**
 * Imagen propia en public/images/: existe `${base}-${ancho}.avif` y `.webp` para cada
 * ancho (generadas desde los originales; ver contexto.md, «Imágenes»).
 */
export interface ResponsiveImage {
  base: string;
  widths: number[];
}

export const LOGO_IMAGE: ResponsiveImage = { base: "/images/logo", widths: [160, 320, 480] };
/** URL absoluta del logo (PNG) para JSON-LD y usos fuera del sitio. */
export const LOGO_URL = `${SITE_URL}/images/logo.png`;
/** Imagen Open Graph (JPG de 1200 px) con URL absoluta del dominio. */
export const OG_IMAGE_URL = `${SITE_URL}/images/og.jpg`;

export const HERO_IMAGE: ResponsiveImage = { base: "/images/hero", widths: [480, 768, 1024] };
export const TECHNICIAN_IMAGE: ResponsiveImage = {
  base: "/images/tecnico",
  widths: [480, 768, 1024],
};
export const CALI_IMAGE: ResponsiveImage = {
  base: "/images/cali",
  widths: [480, 768, 1024, 1280],
};
export const PROJECT_IMAGE_WIDTHS = [480, 768, 1200];
/**
 * Ancho real de la tarjeta de fotos del hero: ancho de pantalla menos márgenes en móvil,
 * `max-w-md` (448 px) hasta `lg` y 5 de 12 columnas de `max-w-7xl` desde `lg`. Lo usan
 * el <picture> y el preload del <head>.
 */
export const HERO_IMAGE_SIZES =
  "(min-width: 1280px) 506px, (min-width: 1024px) 40vw, (min-width: 480px) 448px, calc(100vw - 32px)";

export const BRAND_COLORS = {
  blue: "#0087C3",
  green: "#88BD4C",
  yellow: "#F3CB35",
  gray: "#888D91",
  navy: "#0A192F",
};

export const CONTACT = {
  phoneDisplay: "+57 321 740 4511",
  phoneHref: "tel:+573217404511",
  whatsappHref:
    "https://wa.me/573217404511?text=Hola%20TELCOBRAS,%20quisiera%20solicitar%20información%20sobre%20sus%20servicios%20tecnológicos%20para%20mi%20empresa.",
  emailDisplay: "marketing@telcobras.com",
  emailHref: "mailto:marketing@telcobras.com",
  address: "Carrera 83A # 20 - 20, Cali, Valle del Cauca, Colombia",
};

// Pendiente de confirmar con gerencia; se muestra tal cual en el footer.
export const HORARIO = "[PENDIENTE: horario de gerencia]";

export const CHATBOT_PHONE = {
  display: "+57 310 677 7412",
  href: "tel:+573106777412",
};

export interface ServiceItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  color: string;
  badge: string;
}

export const SERVICIOS_DATA: ServiceItem[] = [
  {
    id: "conectividad",
    title: "Conectividad de Alta Disponibilidad",
    tagline:
      "Internet Dedicado y Banda Ancha sobre fibra óptica propia y radioenlace de microondas.",
    description:
      "Diseñamos e implementamos redes robustas para garantizar que las operaciones de tu empresa nunca se detengan, respaldadas por disponibilidad de red del 99,6 %.",
    features: [
      "Internet Dedicado corporativo",
      "Red SD-WAN para optimización inteligente de tráfico",
      "Enlaces de datos punto a punto y multipunto corporativos",
      "Infraestructura Wi-Fi administrada",
      "Redundancia automática",
    ],
    color: "#0087C3",
    badge: "Infraestructura Propia",
  },
  {
    id: "seguridad",
    title: "Seguridad Integral y Ciberdefensa",
    tagline: "Protección perimetral y digital sincronizada contra amenazas emergentes.",
    description:
      "Resguardamos la información sensible y la continuidad operacional de tu negocio mediante arquitecturas avanzadas de Next-Gen Firewall y monitoreo continuo.",
    features: [
      "Seguridad Sincronizada y monitoreo inteligente de red",
      "Control unificado desde un único dispositivo centralizado",
      "Análisis predictivo de ciberamenazas e intromisiones",
      "Protección anti-DDoS avanzada de mitigación en tiempo real",
      "Auditoría y cumplimiento de estándares internacionales",
    ],
    color: "#88BD4C",
    badge: "Protección Sincronizada",
  },
  {
    id: "colaboracion",
    title: "Colaboración y Comunicaciones Unificadas",
    tagline: "Conecta a tus equipos sin importar dónde se encuentren con movilidad total.",
    description:
      "Soluciones que impulsan el trabajo híbrido con telefonía IP corporativa, videoconferencia en alta definición y plataformas integradas de mensajería.",
    features: [
      "Plataforma integral para teletrabajo y movilidad corporativa",
      "Salas virtuales e integración de audioconferencias HD",
      "Centrales telefónicas IP administradas en la nube",
      "Mensajería unificada con presencia y estado en tiempo real",
      "Integración transparente con plataformas Microsoft y CRM",
    ],
    color: "#F3CB35",
    badge: "Trabajo Híbrido",
  },
  {
    id: "nube",
    title: "Nube Híbrida",
    tagline: "Infraestructura flexible, escalable y segura disponible 24/7/365.",
    description:
      "Aceleramos tu migración digital combinando la agilidad de la nube con el control de tu propia infraestructura, respaldada por ingeniería especializada.",
    features: [
      "Nube híbrida personalizada para cargas de trabajo críticas",
      "Almacenamiento y respaldos automatizados (Backup & Disaster Recovery)",
      "Disponibilidad de red del 99,6 %",
      "Soporte 24/7 con ingeniería especializada",
      "Optimización de costos operativos de TI",
    ],
    color: "#0087C3",
    badge: "Escalabilidad Total",
  },
  {
    id: "agentes-ia",
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
    color: "#0087C3",
    badge: "Inteligencia Artificial",
  },
];

export interface ProyectoItem {
  id: string;
  titulo: string;
  descripcion: string;
  /** Base de la imagen en public/images/ (anchos en PROJECT_IMAGE_WIDTHS). */
  imagen: string;
  alt: string;
  categoria: string;
  ubicacion?: string;
  destacado: boolean;
  descripcionLarga?: string;
}

export const PROYECTOS_DATA: ProyectoItem[] = [
  {
    id: "vigilancia-risaralda",
    titulo: "Vigilancia y mitigación de amenazas y riesgos en el municipio de Risaralda",
    descripcion:
      "Vigilancia y mitigación de amenazas y riesgos en el municipio de Risaralda, con despliegue de monitoreo sobre infraestructura de telecomunicaciones.",
    imagen: "/images/proyecto-vigilancia-risaralda",
    alt: "Técnicos trabajando en una torre de telecomunicaciones en Risaralda",
    categoria: "Seguridad y monitoreo",
    ubicacion: "Risaralda",
    destacado: false,
  },
  {
    id: "chatbot-espy",
    titulo: "Chatbot para la ESPY",
    descripcion:
      "Solución de atención automatizada para las necesidades de la entidad, mediante un asistente conversacional integrado.",
    imagen: "/images/proyecto-chatbot-espy",
    alt: "Ilustración de un asistente virtual para la ESPY",
    categoria: "Inteligencia Artificial",
    destacado: false,
  },
  {
    id: "automatizacion-agua-cali",
    titulo: "Automatización de plantas de tratamiento de agua en Cali",
    descripcion:
      "Automatización, control e instalación de controladores y sensores de variables de agua integrados por telemetría, para mejorar el servicio de agua potable a la comunidad.",
    imagen: "/images/proyecto-automatizacion-agua-cali",
    alt: "Planta industrial de tratamiento de agua en Cali",
    categoria: "Automatización y telemetría",
    ubicacion: "Cali",
    destacado: true,
  },
  {
    id: "zonas-wifi-corregimientos",
    titulo: "Zonas Wi-Fi gratis en parques principales de corregimientos a nivel nacional",
    descripcion:
      "Instalación y puesta en marcha del proyecto insignia de gobierno de internet para todos.",
    imagen: "/images/proyecto-zonas-wifi-corregimientos",
    alt: "Persona usando su celular en un parque con zona Wi-Fi gratis",
    categoria: "Conectividad",
    ubicacion: "Corregimientos a nivel nacional",
    destacado: false,
  },
  {
    id: "nodos-telemetria-cali",
    titulo: "Nodos de telemetría en Santiago de Cali",
    descripcion:
      "Instalación de sensores LoRaWAN para la automatización y gestión de la energía en luminarias de alumbrado público.",
    imagen: "/images/proyecto-nodos-telemetria-cali",
    alt: "Alumbrado público nocturno en Santiago de Cali",
    categoria: "Telemetría IoT",
    ubicacion: "Santiago de Cali",
    destacado: false,
  },
  {
    id: "centros-digitales-claro",
    titulo: "Centros Digitales Claro",
    descripcion: "Instalación de zonas Wi-Fi en escuelas de zonas rurales.",
    imagen: "/images/proyecto-centros-digitales-claro",
    alt: "Estudiantes con dispositivos en una escuela rural",
    categoria: "Conectividad",
    ubicacion: "Zonas rurales",
    destacado: false,
  },
];
