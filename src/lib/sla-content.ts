import { RAZON_SOCIAL, SUPPORT } from "@/lib/telcobras-data";
import type { LegalDocumentCopy } from "@/lib/legal-types";
import { LEGAL_META } from "@/lib/legal-meta";

/**
 * VALORES DEL SLA — PROPUESTA PENDIENTE DE APROBACIÓN POR GERENCIA.
 *
 * Todos los compromisos numéricos de la página /sla salen de aquí. Cambiar un valor en
 * este bloque lo cambia en español y en inglés. Referencias de mercado revisadas el
 * 26-10-2026: Media Commerce (oferta pública: 99,7 % y créditos de 5 % a 100 %) y ETB
 * (anexo técnico de ANS: 99,7 %, P1 2 h, aviso de mantenimiento de 9 días hábiles).
 * El portafolio de Telcobras cita 99,6 % y +99,7 %: confirmar cuál se compromete.
 */
export const SLA_VALUES = {
  /** Disponibilidad mensual comprometida para servicios de conectividad. */
  availability: { es: "99,6 %", en: "99.6%" },
  maintenanceNoticeBusinessDays: 5,
  maintenanceWindow: {
    es: "entre las 00:00 y las 06:00 (hora de Colombia)",
    en: "between 00:00 and 06:00 (Colombia time)",
  },
  maintenanceMaxHoursPerMonth: 4,
  creditClaimDays: 30,
  creditCapPercent: 50,
  availabilityReportBusinessDays: 10,
  acceptanceThresholdPercent: 90,
  installationWarrantyDays: 90,
  softwareWarrantyDays: 60,
  /** [prioridad, tiempo de respuesta, tiempo objetivo de restablecimiento] */
  priorities: {
    es: [
      [
        "P1 · Crítica",
        "Servicio caído por completo o sede sin conectividad.",
        "30 minutos",
        "4 horas",
      ],
      [
        "P2 · Alta",
        "Servicio degradado: lentitud, pérdida de paquetes o falla parcial.",
        "1 hora",
        "8 horas",
      ],
      ["P3 · Media", "Falla intermitente o que afecta a pocos usuarios.", "4 horas", "24 horas"],
      [
        "P4 · Baja",
        "Consultas, cambios de configuración y solicitudes programables.",
        "1 día hábil",
        "5 días hábiles",
      ],
    ],
    en: [
      [
        "P1 · Critical",
        "Service completely down or site without connectivity.",
        "30 minutes",
        "4 hours",
      ],
      [
        "P2 · High",
        "Degraded service: slowness, packet loss or partial failure.",
        "1 hour",
        "8 hours",
      ],
      ["P3 · Medium", "Intermittent failure or one affecting few users.", "4 hours", "24 hours"],
      [
        "P4 · Low",
        "Questions, configuration changes and requests that can be scheduled.",
        "1 business day",
        "5 business days",
      ],
    ],
  },
  /** [rango de disponibilidad mensual, crédito sobre el cargo mensual del servicio afectado] */
  credits: {
    es: [
      ["Igual o mayor a 99,6 %", "0 %"],
      ["De 99,0 % a menos de 99,6 %", "5 %"],
      ["De 98,0 % a menos de 99,0 %", "10 %"],
      ["De 97,0 % a menos de 98,0 %", "20 %"],
      ["De 95,0 % a menos de 97,0 %", "30 %"],
      ["Menor a 95,0 %", "50 %"],
    ],
    en: [
      ["99.6% or higher", "0%"],
      ["From 99.0% to less than 99.6%", "5%"],
      ["From 98.0% to less than 99.0%", "10%"],
      ["From 97.0% to less than 98.0%", "20%"],
      ["From 95.0% to less than 97.0%", "30%"],
      ["Below 95.0%", "50%"],
    ],
  },
} as const;

const v = SLA_VALUES;
// Canales del Centro de Gestión (soporte técnico 24/7), desde SUPPORT en telcobras-data.ts.
const supportPhones = SUPPORT.phones.map((phone) => phone.display).join(", ");
const channels = `${supportPhones} y ${SUPPORT.emailDisplay}`;
const channelsEn = `${supportPhones} and ${SUPPORT.emailDisplay}`;

const es: LegalDocumentCopy = {
  metaTitle: LEGAL_META.sla.es.metaTitle,
  title: "SLA y garantías",
  description: LEGAL_META.sla.es.description,
  updated: "Fecha de actualización: 26 de octubre de 2026",
  intro: `Este acuerdo de niveles de servicio (SLA, por sus siglas en inglés) describe lo que ${RAZON_SOCIAL} se compromete a cumplir cuando presta sus servicios: cuánto tiempo debe estar disponible el servicio, en cuánto tiempo atendemos una falla y qué recibe el cliente si no cumplimos. Hace parte de los Términos de servicio. Si la propuesta comercial o el contrato de un cliente fija valores distintos, prevalecen esos valores.`,
  backToHome: "Volver al inicio",
  tocLabel: "Contenido",
  sections: [
    {
      id: "alcance",
      title: "1. Alcance",
      paragraphs: [
        "Este SLA aplica a los servicios activos y aceptados por el cliente mediante acta de entrega o activación.",
      ],
      items: [
        "Conectividad: internet dedicado, banda ancha empresarial, enlaces de datos, SD-WAN y Wi-Fi administrado. Tienen compromiso de disponibilidad y créditos.",
        "Seguridad, colaboración y nube híbrida: tienen compromiso de atención y restablecimiento. La disponibilidad se pacta en cada propuesta cuando aplica.",
        "Agentes con inteligencia artificial y desarrollos a la medida: tienen compromiso de soporte y la garantía de la sección 9. La disponibilidad se pacta en cada propuesta.",
      ],
    },
    {
      id: "disponibilidad",
      title: `2. Disponibilidad comprometida: ${v.availability.es} mensual`,
      highlight: true,
      paragraphs: [
        `Para los servicios de conectividad, ${RAZON_SOCIAL} se compromete a una disponibilidad mensual de ${v.availability.es}, salvo que la propuesta comercial indique otro valor.`,
        "Fórmula: Disponibilidad (%) = (minutos del mes − minutos de indisponibilidad imputable) ÷ minutos del mes × 100.",
        "Un servicio está indisponible cuando no puede transmitir tráfico entre el equipo de TELCOBRAS en la sede del cliente y la red de TELCOBRAS. La medición se hace con el sistema de monitoreo del Centro de Gestión. La indisponibilidad empieza cuando se detecta o se reporta la falla, lo que ocurra primero, y termina cuando el servicio se restablece.",
        "Las pruebas de velocidad en sitios web públicos no sirven para medir la disponibilidad ni la capacidad contratada, porque dependen de servidores y redes que TELCOBRAS no controla.",
      ],
    },
    {
      id: "atencion",
      title: "3. Atención de fallas por prioridad",
      paragraphs: [
        "El Centro de Gestión atiende reportes las 24 horas, los 7 días de la semana, los 365 días del año. Cada reporte recibe un número de caso y una prioridad según su impacto.",
      ],
      table: {
        caption: "Tiempos de respuesta y de restablecimiento por prioridad",
        headers: ["Prioridad", "Situación", "Respuesta", "Restablecimiento objetivo"],
        rows: v.priorities.es.map((row) => [...row]),
      },
      notes: [
        "Respuesta: tiempo hasta que un técnico confirma el caso e inicia el diagnóstico. Restablecimiento: tiempo hasta que el servicio vuelve a operar, aunque sea con una solución temporal. Cuando la falla requiere visita a una sede fuera del área urbana de Cali u obras sobre la red de terceros, el tiempo de restablecimiento se informa en el caso.",
      ],
    },
    {
      id: "reporte",
      title: "4. Cómo reportar una falla",
      paragraphs: [
        `Canales: ${channels}. Para agilizar el diagnóstico, indique la razón social, la sede, el servicio afectado, la hora en que empezó la falla y lo que ya revisó.`,
      ],
      items: [
        "Nivel 1 — Centro de Gestión: atiende el caso desde el primer contacto.",
        "Nivel 2 — Coordinación del Centro de Gestión: si un caso P1 o P2 supera la mitad del tiempo objetivo sin solución.",
        "Nivel 3 — Dirección de Operaciones: si un caso P1 supera el tiempo objetivo.",
      ],
    },
    {
      id: "mantenimiento",
      title: "5. Mantenimientos",
      items: [
        `Programados: se avisan con al menos ${v.maintenanceNoticeBusinessDays} días hábiles de anticipación por correo al contacto técnico del cliente. Se hacen ${v.maintenanceWindow.es} y suman como máximo ${v.maintenanceMaxHoursPerMonth} horas al mes por servicio. No cuentan como indisponibilidad.`,
        "De emergencia: cuando hay un riesgo inmediato para la red o la seguridad, se avisan tan pronto como sea posible. Cuentan como indisponibilidad, salvo que la causa sea una de las exclusiones de la sección 7.",
        "El cliente puede pedir que un mantenimiento se reprograme. Si lo rechaza sin proponer otra fecha y la falla que se quería prevenir ocurre, ese tiempo no cuenta como indisponibilidad.",
      ],
    },
    {
      id: "creditos",
      title: "6. Créditos por indisponibilidad",
      paragraphs: [
        "Si la disponibilidad de un mes queda por debajo de lo comprometido, el cliente recibe un crédito sobre el cargo mensual del servicio afectado, según esta tabla:",
      ],
      table: {
        caption: "Crédito según la disponibilidad mensual",
        headers: ["Disponibilidad del mes", "Crédito"],
        rows: v.credits.es.map((row) => [...row]),
      },
      notes: [
        `El crédito se solicita dentro de los ${v.creditClaimDays} días calendario siguientes al cierre del mes y se aplica en la factura siguiente. El total de créditos de un mes no supera el ${v.creditCapPercent} % del cargo mensual del servicio afectado. Cuando el cliente está cubierto por el Régimen de Protección de los Derechos de los Usuarios de la Comisión de Regulación de Comunicaciones (CRC), TELCOBRAS aplica además la compensación automática que ese régimen exige.`,
      ],
    },
    {
      id: "exclusiones",
      title: "7. Lo que no cuenta como indisponibilidad",
      items: [
        "Mantenimientos programados y avisados según la sección 5.",
        "Fallas en equipos, red interna, cableado o energía eléctrica a cargo del cliente.",
        "Cambios de configuración hechos por el cliente o por terceros que él autorizó.",
        "Falta de acceso a la sede o a los equipos cuando TELCOBRAS lo solicita para atender la falla.",
        "Suspensión del servicio por mora en el pago o por incumplimiento de los Términos de servicio.",
        "Fuerza mayor o caso fortuito, incluidos desastres naturales, orden de autoridad y actos de terceros como vandalismo o hurto de infraestructura.",
        "Fallas de servicios o plataformas de terceros contratados directamente por el cliente.",
      ],
    },
    {
      id: "capacidad",
      title: "8. Capacidad contratada y reportes",
      items: [
        `Prueba de aceptación: al activar un enlace, TELCOBRAS hace una prueba de tráfico con el cliente. El enlace se acepta cuando entrega al menos el ${v.acceptanceThresholdPercent} % de la capacidad contratada, medida desde el equipo de TELCOBRAS en la sede.`,
        `Reporte de disponibilidad: el cliente puede pedir el reporte mensual de disponibilidad de sus servicios. TELCOBRAS lo entrega dentro de los ${v.availabilityReportBusinessDays} días hábiles siguientes a la solicitud.`,
      ],
    },
    {
      id: "garantias",
      title: "9. Garantías",
      items: [
        "Equipos en comodato (entregados en préstamo para prestar el servicio): TELCOBRAS los repara o reemplaza sin costo cuando la falla no se debe a mal uso, manipulación por terceros, descargas o fallas eléctricas en la sede. Si la causa es imputable al cliente, la reparación o reposición se cobra según la propuesta.",
        "Equipos vendidos: tienen la garantía del fabricante, que TELCOBRAS gestiona ante él. El plazo se indica en la propuesta o en la factura.",
        `Instalaciones y obras: ${v.installationWarrantyDays} días calendario por defectos de mano de obra, contados desde el acta de entrega.`,
        `Desarrollos de software y agentes de inteligencia artificial: ${v.softwareWarrantyDays} días calendario de corrección sin costo de errores frente al alcance aprobado. Los cambios de alcance o las funciones nuevas se cotizan aparte.`,
      ],
    },
    {
      id: "cambios",
      title: "10. Cambios a este SLA",
      paragraphs: [
        "TELCOBRAS puede actualizar este SLA. La versión vigente se publica en esta página con su fecha. Los cambios no reducen los compromisos de contratos vigentes hasta su renovación, salvo que el cliente los acepte por escrito.",
      ],
    },
  ],
  related: {
    text: "Documentos relacionados:",
    links: [
      { to: "/terminos-de-servicio", label: "Términos de servicio" },
      { to: "/politica-de-privacidad", label: "Política de privacidad" },
    ],
  },
};

const en: LegalDocumentCopy = {
  metaTitle: LEGAL_META.sla.en.metaTitle,
  title: "SLA and warranties",
  description: LEGAL_META.sla.en.description,
  updated: "Last updated: October 26, 2026",
  intro: `This service level agreement (SLA) describes what ${RAZON_SOCIAL} commits to when it provides its services: how long the service must be available, how quickly we respond to a failure, and what the client receives if we fall short. It is part of the Terms of Service. If a client's commercial proposal or contract sets different values, those values prevail. The Spanish version prevails in case of discrepancy.`,
  backToHome: "Back to home",
  tocLabel: "Contents",
  sections: [
    {
      id: "alcance",
      title: "1. Scope",
      paragraphs: [
        "This SLA applies to services that are active and accepted by the client through a delivery or activation record.",
      ],
      items: [
        "Connectivity: dedicated internet, business broadband, data links, SD-WAN and managed Wi-Fi. They carry an availability commitment and service credits.",
        "Security, collaboration and hybrid cloud: they carry response and restoration commitments. Availability is agreed in each proposal when applicable.",
        "Artificial intelligence agents and custom software: they carry a support commitment and the warranty in section 9. Availability is agreed in each proposal.",
      ],
    },
    {
      id: "disponibilidad",
      title: `2. Committed availability: ${v.availability.en} per month`,
      highlight: true,
      paragraphs: [
        `For connectivity services, ${RAZON_SOCIAL} commits to a monthly availability of ${v.availability.en}, unless the commercial proposal states another value.`,
        "Formula: Availability (%) = (minutes in the month − attributable downtime minutes) ÷ minutes in the month × 100.",
        "A service is unavailable when it cannot carry traffic between the TELCOBRAS equipment at the client's site and the TELCOBRAS network. It is measured by the Network Operations Center monitoring system. Downtime starts when the failure is detected or reported, whichever comes first, and ends when service is restored.",
        "Public website speed tests are not used to measure availability or contracted capacity, because they depend on servers and networks TELCOBRAS does not control.",
      ],
    },
    {
      id: "atencion",
      title: "3. Failure handling by priority",
      paragraphs: [
        "The Network Operations Center handles reports 24 hours a day, 7 days a week, 365 days a year. Each report receives a case number and a priority based on its impact.",
      ],
      table: {
        caption: "Response and restoration times by priority",
        headers: ["Priority", "Situation", "Response", "Target restoration"],
        rows: v.priorities.en.map((row) => [...row]),
      },
      notes: [
        "Response: time until a technician confirms the case and starts diagnosis. Restoration: time until the service operates again, even with a temporary fix. When the failure requires a visit to a site outside urban Cali or work on third-party networks, the restoration time is reported in the case.",
      ],
    },
    {
      id: "reporte",
      title: "4. How to report a failure",
      paragraphs: [
        `Channels: ${channelsEn}. To speed up diagnosis, include the company name, site, affected service, the time the failure started and what you have already checked.`,
      ],
      items: [
        "Level 1 — Network Operations Center: handles the case from first contact.",
        "Level 2 — Network Operations Center coordination: if a P1 or P2 case exceeds half its target time without a fix.",
        "Level 3 — Operations management: if a P1 case exceeds its target time.",
      ],
    },
    {
      id: "mantenimiento",
      title: "5. Maintenance",
      items: [
        `Scheduled: notified at least ${v.maintenanceNoticeBusinessDays} business days in advance by email to the client's technical contact. It takes place ${v.maintenanceWindow.en} and totals at most ${v.maintenanceMaxHoursPerMonth} hours per month per service. It does not count as downtime.`,
        "Emergency: when there is an immediate risk to the network or to security, it is notified as soon as possible. It counts as downtime unless the cause is one of the exclusions in section 7.",
        "The client may ask for maintenance to be rescheduled. If the client rejects it without proposing another date and the failure it was meant to prevent occurs, that time does not count as downtime.",
      ],
    },
    {
      id: "creditos",
      title: "6. Service credits for downtime",
      paragraphs: [
        "If a month's availability falls below the commitment, the client receives a credit on the monthly charge of the affected service, according to this table:",
      ],
      table: {
        caption: "Credit by monthly availability",
        headers: ["Availability in the month", "Credit"],
        rows: v.credits.en.map((row) => [...row]),
      },
      notes: [
        `Credits are requested within ${v.creditClaimDays} calendar days after the end of the month and applied to the next invoice. Total credits in a month do not exceed ${v.creditCapPercent}% of the monthly charge of the affected service. When the client is covered by the User Rights Protection Regime of Colombia's Communications Regulation Commission (CRC), TELCOBRAS also applies the automatic compensation that regime requires.`,
      ],
    },
    {
      id: "exclusiones",
      title: "7. What does not count as downtime",
      items: [
        "Scheduled maintenance notified under section 5.",
        "Failures in equipment, internal network, cabling or electrical power under the client's responsibility.",
        "Configuration changes made by the client or by third parties the client authorized.",
        "Lack of access to the site or equipment when TELCOBRAS requests it to handle the failure.",
        "Service suspension due to late payment or breach of the Terms of Service.",
        "Force majeure or acts of God, including natural disasters, orders from authorities and third-party acts such as vandalism or theft of infrastructure.",
        "Failures of third-party services or platforms contracted directly by the client.",
      ],
    },
    {
      id: "capacidad",
      title: "8. Contracted capacity and reports",
      items: [
        `Acceptance test: when a link is activated, TELCOBRAS runs a traffic test with the client. The link is accepted when it delivers at least ${v.acceptanceThresholdPercent}% of the contracted capacity, measured from the TELCOBRAS equipment at the site.`,
        `Availability report: the client may request the monthly availability report for its services. TELCOBRAS delivers it within ${v.availabilityReportBusinessDays} business days of the request.`,
      ],
    },
    {
      id: "garantias",
      title: "9. Warranties",
      items: [
        "Loaned equipment (provided on loan to deliver the service): TELCOBRAS repairs or replaces it at no cost when the failure is not caused by misuse, third-party tampering, power surges or electrical faults at the site. If the cause is attributable to the client, repair or replacement is charged according to the proposal.",
        "Purchased equipment: covered by the manufacturer's warranty, which TELCOBRAS manages with the manufacturer. The term is stated in the proposal or invoice.",
        `Installations and works: ${v.installationWarrantyDays} calendar days for workmanship defects, counted from the delivery record.`,
        `Software and artificial intelligence agents: ${v.softwareWarrantyDays} calendar days of free correction of defects against the approved scope. Scope changes or new features are quoted separately.`,
      ],
    },
    {
      id: "cambios",
      title: "10. Changes to this SLA",
      paragraphs: [
        "TELCOBRAS may update this SLA. The current version is published on this page with its date. Changes do not reduce the commitments of contracts in force until their renewal, unless the client accepts them in writing.",
      ],
    },
  ],
  related: {
    text: "Related documents:",
    links: [
      { to: "/terminos-de-servicio", label: "Terms of Service" },
      { to: "/politica-de-privacidad", label: "Privacy Policy" },
    ],
  },
};

export const slaContent = { es, en } as const;
