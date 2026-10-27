import { CONTACT, RAZON_SOCIAL, SUPPORT } from "@/lib/telcobras-data";
import type { LegalDocumentCopy } from "@/lib/legal-types";
import { LEGAL_META } from "@/lib/legal-meta";

// Canales de PQR: los del Centro de Gestión (SUPPORT en telcobras-data.ts).
const supportPhonesEs = SUPPORT.phones.map((phone) => phone.display).join(" y ");
const supportPhonesEn = SUPPORT.phones.map((phone) => phone.display).join(" and ");

/**
 * Términos de servicio de TELCOBRAS S.A.S. Texto propio, redactado tomando como
 * referencia la estructura pública de Internexa (términos de uso del portal y política
 * de uso de red), Media Commerce y ETB, y el marco colombiano: Ley 1341 de 2009,
 * Resolución CRC 5050 de 2016, Ley 1581 de 2012 y Ley 527 de 1999.
 * PENDIENTE: revisión del asesor jurídico antes de publicar.
 */

const es: LegalDocumentCopy = {
  metaTitle: LEGAL_META.terms.es.metaTitle,
  title: "Términos de servicio",
  description: LEGAL_META.terms.es.description,
  updated: "Fecha de actualización: 26 de octubre de 2026",
  intro: `Estos términos explican las reglas con las que ${RAZON_SOCIAL} (en adelante, TELCOBRAS) presta sus servicios a empresas y entidades, y las condiciones para usar este sitio web. Al contratar un servicio o al usar el sitio, el cliente o el visitante los acepta. Le recomendamos leerlos junto con el SLA y garantías y la Política de privacidad.`,
  backToHome: "Volver al inicio",
  tocLabel: "Contenido",
  sections: [
    {
      id: "objeto",
      title: "1. Objeto y documentos del servicio",
      paragraphs: [
        "Estos términos aplican a los servicios de conectividad, seguridad, colaboración, nube híbrida, agentes con inteligencia artificial y demás soluciones que TELCOBRAS ofrece. Cada servicio se rige por estos documentos, en este orden de prioridad:",
      ],
      items: [
        "El contrato firmado con el cliente, si existe.",
        "La propuesta comercial o cotización aceptada y la orden de servicio.",
        "El SLA y garantías publicado en este sitio.",
        "Estos términos de servicio.",
      ],
      notes: [
        "La aceptación puede hacerse por firma física o electrónica, por correo o por cualquier medio que deje constancia, conforme a la Ley 527 de 1999.",
      ],
    },
    {
      id: "contratacion",
      title: "2. Contratación, instalación y activación",
      items: [
        "El cliente solicita el servicio y TELCOBRAS envía una propuesta con el alcance, el precio, el plazo de instalación y la duración.",
        "Antes de instalar, TELCOBRAS puede hacer una visita técnica de factibilidad. Si la visita muestra que hacen falta obras no previstas, se informa al cliente antes de continuar.",
        "El cliente facilita el acceso a la sede, el espacio, la energía eléctrica regulada y los permisos de la copropiedad o de terceros que se necesiten.",
        "El servicio queda activo cuando se firma el acta de entrega o cuando el cliente empieza a usarlo, lo que ocurra primero. Desde ese momento se factura.",
      ],
    },
    {
      id: "obligaciones-telcobras",
      title: "3. Compromisos de TELCOBRAS",
      items: [
        "Prestar el servicio con la calidad y la disponibilidad del SLA y de la propuesta.",
        "Mantener el Centro de Gestión disponible las 24 horas para el reporte de fallas.",
        "Avisar los mantenimientos programados con la anticipación indicada en el SLA.",
        "Proteger la información del cliente con medidas técnicas y organizativas razonables.",
        "Informar con claridad los precios, los cargos y las condiciones antes de la contratación.",
      ],
    },
    {
      id: "obligaciones-cliente",
      title: "4. Compromisos del cliente",
      items: [
        "Pagar las facturas en la fecha de vencimiento.",
        "Usar el servicio según la ley y la sección 5 de estos términos.",
        "Cuidar los equipos entregados en comodato y no moverlos, abrirlos ni modificarlos sin autorización.",
        "Mantener en buen estado su red interna, su cableado y su suministro eléctrico.",
        "Designar un contacto técnico y uno administrativo, y mantener sus datos actualizados.",
        "Guardar de forma segura las contraseñas y credenciales de acceso que reciba.",
      ],
    },
    {
      id: "uso-aceptable",
      title: "5. Uso aceptable",
      paragraphs: ["No está permitido usar los servicios ni la red de TELCOBRAS para:"],
      items: [
        "Actividades ilegales, fraude, suplantación de identidad o distribución de contenido prohibido por la ley colombiana.",
        "Enviar correo masivo no solicitado (spam) o hacer campañas que incumplan la ley.",
        "Atacar, escanear sin autorización o intentar acceder a redes, sistemas o cuentas ajenas, o distribuir software malicioso.",
        "Infringir derechos de autor, marcas u otros derechos de propiedad intelectual.",
        "Revender o ceder el servicio a terceros sin autorización escrita de TELCOBRAS.",
        "Afectar la operación de la red o el servicio de otros clientes.",
      ],
      notes: [
        "Si TELCOBRAS detecta un uso prohibido, puede pedir que se corrija, limitar el tráfico afectado o suspender el servicio según la sección 8. El cliente puede reportar abusos o preguntar si una actividad está permitida a los canales de la sección 13.",
      ],
    },
    {
      id: "equipos",
      title: "6. Equipos en comodato",
      paragraphs: [
        "Los equipos que TELCOBRAS instala para prestar el servicio son de su propiedad y se entregan en comodato (préstamo de uso). Al terminar el servicio, el cliente los devuelve en buen estado, salvo el desgaste normal. Si no los devuelve o se dañan por causas imputables al cliente, TELCOBRAS cobra su valor según la propuesta. Los equipos comprados por el cliente son de su propiedad desde el pago y tienen la garantía descrita en el SLA.",
      ],
    },
    {
      id: "facturacion",
      title: "7. Precios, facturación y pago",
      items: [
        "Los precios, impuestos y cargos únicos se indican en la propuesta aceptada.",
        "TELCOBRAS factura de forma electrónica, por periodo vencido o anticipado según la propuesta.",
        "Si el cliente no paga en la fecha de vencimiento, TELCOBRAS puede cobrar intereses de mora hasta la tasa máxima legal y suspender el servicio con aviso previo, según la sección 8.",
        "Las reclamaciones sobre una factura se presentan por los canales de la sección 13. Mientras se resuelven, el cliente paga la parte no reclamada.",
      ],
    },
    {
      id: "suspension",
      title: "8. Suspensión del servicio",
      paragraphs: ["TELCOBRAS puede suspender el servicio, total o parcialmente, en estos casos:"],
      items: [
        "Mora en el pago, después de avisar al cliente con al menos 5 días hábiles de anticipación.",
        "Uso prohibido según la sección 5, o riesgo para la seguridad de la red o de otros clientes. En este caso la suspensión puede ser inmediata y se informa al cliente.",
        "Orden de una autoridad competente.",
      ],
      notes: [
        "El servicio se restablece cuando desaparece la causa. El tiempo de suspensión por estas causas no cuenta como indisponibilidad en el SLA.",
      ],
    },
    {
      id: "duracion",
      title: "9. Duración, renovación y terminación",
      items: [
        "La duración mínima, si existe, se indica en la propuesta. Al vencer, el servicio se renueva por periodos iguales salvo que una de las partes avise lo contrario con 30 días calendario de anticipación.",
        "El cliente puede terminar el servicio en cualquier momento con aviso escrito. Si termina antes de la duración mínima pactada, paga lo indicado en la propuesta para ese caso.",
        "Cuando la regulación de la CRC aplica al contrato, las cláusulas de permanencia mínima solo se pactan con aceptación expresa del cliente, a cambio de un beneficio en el cargo de conexión y con un plazo máximo de 12 meses, y TELCOBRAS siempre ofrece la opción sin permanencia.",
        "Cualquiera de las partes puede terminar el contrato si la otra incumple una obligación esencial y no la corrige dentro de los 15 días hábiles siguientes al aviso.",
      ],
    },
    {
      id: "responsabilidad",
      title: "10. Responsabilidad",
      items: [
        "TELCOBRAS responde por los daños directos que cause por incumplir sus obligaciones. Por fallas de disponibilidad, la compensación es la del SLA, sin perjuicio de los derechos que la ley no permite limitar.",
        "TELCOBRAS no responde por lucro cesante, pérdida de información no respaldada por el cliente, ni por daños causados por el contenido que el cliente transmite o por servicios de terceros que contrató directamente.",
        "Ninguna de las partes responde por incumplimientos causados por fuerza mayor o caso fortuito, como desastres naturales, orden de autoridad o actos de terceros que no se puedan prever ni resistir.",
      ],
    },
    {
      id: "confidencialidad",
      title: "11. Confidencialidad, datos personales y propiedad intelectual",
      items: [
        "Las partes mantienen en reserva la información técnica, comercial y financiera que reciban de la otra, durante el contrato y 2 años después.",
        "TELCOBRAS trata los datos personales conforme a la Ley 1581 de 2012 y a su Política de privacidad. Cuando el cliente entrega datos de personas para la prestación del servicio, garantiza que tiene la autorización de sus titulares.",
        "El software, las metodologías y las marcas de TELCOBRAS siguen siendo de TELCOBRAS. En los desarrollos a la medida, la propiedad de lo entregado se define en la propuesta.",
      ],
    },
    {
      id: "sitio-web",
      title: "12. Uso de este sitio web",
      items: [
        "El sitio es informativo y gratuito. Su contenido, textos, imágenes, marcas y diseño son de TELCOBRAS o de sus aliados y no pueden copiarse ni usarse con fines comerciales sin autorización.",
        "Los precios y características publicados son referenciales. Solo obligan los que constan en una propuesta aceptada.",
        "El asistente virtual da orientación general y no reemplaza la propuesta comercial ni la atención del Centro de Gestión.",
        "TELCOBRAS procura que el sitio esté disponible y seguro, pero no garantiza que funcione sin interrupciones. Los enlaces a sitios de terceros se ofrecen como referencia y TELCOBRAS no responde por su contenido.",
        "No está permitido intentar acceder sin autorización a partes del sitio, sobrecargarlo, enviar formularios automatizados ni suplantar a otra persona.",
      ],
    },
    {
      id: "pqr",
      title: "13. Peticiones, quejas y reclamos",
      highlight: true,
      paragraphs: [
        `El cliente puede presentar peticiones, quejas, reclamos y recursos por estos canales: ${supportPhonesEs}, ${SUPPORT.emailDisplay} o en la sede: ${CONTACT.address}. Cada solicitud recibe un número de radicado.`,
        "TELCOBRAS responde dentro de los 15 días hábiles siguientes a la recepción. Cuando aplica el Régimen de Protección de los Derechos de los Usuarios de la CRC, el cliente tiene además los derechos que ese régimen establece, incluido el silencio administrativo positivo si no recibe respuesta a tiempo.",
      ],
    },
    {
      id: "ley",
      title: "14. Ley aplicable y solución de controversias",
      paragraphs: [
        "Estos términos se rigen por la ley colombiana, en particular la Ley 1341 de 2009 y la regulación de la Comisión de Regulación de Comunicaciones cuando aplique. Las partes buscan primero un arreglo directo durante 30 días calendario. Si no lo logran, la controversia se resuelve ante los jueces de Cali, salvo que el contrato pacte otro mecanismo.",
      ],
    },
    {
      id: "cambios",
      title: "15. Cambios a estos términos",
      paragraphs: [
        "TELCOBRAS puede actualizar estos términos. La versión vigente se publica en esta página con su fecha. Los cambios que afecten condiciones esenciales de un contrato vigente se informan al cliente con al menos 30 días calendario de anticipación y no se aplican sin su aceptación cuando la ley lo exige.",
      ],
    },
  ],
  related: {
    text: "Documentos relacionados:",
    links: [
      { to: "/sla", label: "SLA y garantías" },
      { to: "/politica-de-privacidad", label: "Política de privacidad" },
    ],
  },
};

const en: LegalDocumentCopy = {
  metaTitle: LEGAL_META.terms.en.metaTitle,
  title: "Terms of Service",
  description: LEGAL_META.terms.en.description,
  updated: "Last updated: October 26, 2026",
  intro: `These terms explain the rules under which ${RAZON_SOCIAL} (hereinafter, TELCOBRAS) provides its services to companies and organizations, and the conditions for using this website. By contracting a service or using the site, the client or visitor accepts them. We recommend reading them together with the SLA and warranties and the Privacy Policy. The Spanish version prevails in case of discrepancy.`,
  backToHome: "Back to home",
  tocLabel: "Contents",
  sections: [
    {
      id: "objeto",
      title: "1. Purpose and service documents",
      paragraphs: [
        "These terms apply to the connectivity, security, collaboration, hybrid cloud, artificial intelligence agent and other solutions TELCOBRAS offers. Each service is governed by these documents, in this order of priority:",
      ],
      items: [
        "The contract signed with the client, if any.",
        "The accepted commercial proposal or quote and the service order.",
        "The SLA and warranties published on this site.",
        "These terms of service.",
      ],
      notes: [
        "Acceptance may be given by physical or electronic signature, by email or by any means that leaves a record, under Colombian Law 527 of 1999.",
      ],
    },
    {
      id: "contratacion",
      title: "2. Contracting, installation and activation",
      items: [
        "The client requests the service and TELCOBRAS sends a proposal with the scope, price, installation time and term.",
        "Before installing, TELCOBRAS may carry out a technical feasibility visit. If it shows that unplanned works are needed, the client is informed before proceeding.",
        "The client provides access to the site, space, regulated electrical power and any permits required from the building or third parties.",
        "The service becomes active when the delivery record is signed or when the client starts using it, whichever comes first. Billing starts from that moment.",
      ],
    },
    {
      id: "obligaciones-telcobras",
      title: "3. TELCOBRAS commitments",
      items: [
        "Provide the service with the quality and availability stated in the SLA and the proposal.",
        "Keep the Network Operations Center available 24 hours a day for failure reports.",
        "Give notice of scheduled maintenance as stated in the SLA.",
        "Protect client information with reasonable technical and organizational measures.",
        "Clearly disclose prices, charges and conditions before contracting.",
      ],
    },
    {
      id: "obligaciones-cliente",
      title: "4. Client commitments",
      items: [
        "Pay invoices by their due date.",
        "Use the service lawfully and in accordance with section 5 of these terms.",
        "Look after loaned equipment and not move, open or modify it without authorization.",
        "Keep its internal network, cabling and power supply in good condition.",
        "Appoint a technical and an administrative contact and keep their details up to date.",
        "Keep any passwords and access credentials it receives secure.",
      ],
    },
    {
      id: "uso-aceptable",
      title: "5. Acceptable use",
      paragraphs: ["TELCOBRAS services and network may not be used to:"],
      items: [
        "Carry out illegal activities, fraud or identity theft, or distribute content prohibited by Colombian law.",
        "Send unsolicited bulk email (spam) or run campaigns that break the law.",
        "Attack, scan without authorization or attempt to access other networks, systems or accounts, or distribute malicious software.",
        "Infringe copyrights, trademarks or other intellectual property rights.",
        "Resell or assign the service to third parties without written authorization from TELCOBRAS.",
        "Disrupt the network or the service of other clients.",
      ],
      notes: [
        "If TELCOBRAS detects prohibited use, it may ask for it to be corrected, limit the affected traffic or suspend the service under section 8. The client may report abuse or ask whether an activity is allowed through the channels in section 13.",
      ],
    },
    {
      id: "equipos",
      title: "6. Loaned equipment",
      paragraphs: [
        "Equipment TELCOBRAS installs to provide the service remains its property and is provided on loan. When the service ends, the client returns it in good condition, except for normal wear. If it is not returned or is damaged for reasons attributable to the client, TELCOBRAS charges its value according to the proposal. Equipment purchased by the client becomes its property upon payment and carries the warranty described in the SLA.",
      ],
    },
    {
      id: "facturacion",
      title: "7. Prices, billing and payment",
      items: [
        "Prices, taxes and one-time charges are stated in the accepted proposal.",
        "TELCOBRAS issues electronic invoices, in arrears or in advance as stated in the proposal.",
        "If the client does not pay by the due date, TELCOBRAS may charge late-payment interest up to the maximum legal rate and suspend the service with prior notice, under section 8.",
        "Invoice disputes are submitted through the channels in section 13. While they are resolved, the client pays the undisputed portion.",
      ],
    },
    {
      id: "suspension",
      title: "8. Service suspension",
      paragraphs: ["TELCOBRAS may suspend the service, fully or partially, in these cases:"],
      items: [
        "Late payment, after notifying the client at least 5 business days in advance.",
        "Prohibited use under section 5, or a risk to the security of the network or other clients. In this case suspension may be immediate and the client is informed.",
        "An order from a competent authority.",
      ],
      notes: [
        "Service is restored once the cause is removed. Suspension time for these causes does not count as downtime under the SLA.",
      ],
    },
    {
      id: "duracion",
      title: "9. Term, renewal and termination",
      items: [
        "The minimum term, if any, is stated in the proposal. At expiry, the service renews for equal periods unless either party gives 30 calendar days' notice.",
        "The client may terminate the service at any time with written notice. If it terminates before the agreed minimum term, it pays the amount stated in the proposal for that case.",
        "Where CRC regulation applies to the contract, minimum-term clauses are agreed only with the client's express acceptance, in exchange for a benefit on the connection charge and for no more than 12 months, and TELCOBRAS always offers an option without a minimum term.",
        "Either party may terminate the contract if the other breaches an essential obligation and does not remedy it within 15 business days of notice.",
      ],
    },
    {
      id: "responsabilidad",
      title: "10. Liability",
      items: [
        "TELCOBRAS is liable for direct damages caused by breaching its obligations. For availability failures, compensation is as set out in the SLA, without prejudice to rights the law does not allow to be limited.",
        "TELCOBRAS is not liable for lost profits, loss of data not backed up by the client, damages caused by content the client transmits, or third-party services the client contracted directly.",
        "Neither party is liable for breaches caused by force majeure or acts of God, such as natural disasters, orders from authorities or third-party acts that cannot be foreseen or resisted.",
      ],
    },
    {
      id: "confidencialidad",
      title: "11. Confidentiality, personal data and intellectual property",
      items: [
        "The parties keep confidential the technical, commercial and financial information they receive from each other, during the contract and for 2 years afterwards.",
        "TELCOBRAS processes personal data in accordance with Colombian Law 1581 of 2012 and its Privacy Policy. When the client provides personal data for the service, it warrants that it has the data subjects' authorization.",
        "TELCOBRAS software, methodologies and trademarks remain the property of TELCOBRAS. For custom developments, ownership of deliverables is defined in the proposal.",
      ],
    },
    {
      id: "sitio-web",
      title: "12. Use of this website",
      items: [
        "The site is informational and free of charge. Its content, text, images, trademarks and design belong to TELCOBRAS or its partners and may not be copied or used commercially without authorization.",
        "Published prices and features are for reference only. Only those in an accepted proposal are binding.",
        "The virtual assistant provides general guidance and does not replace the commercial proposal or Network Operations Center support.",
        "TELCOBRAS strives to keep the site available and secure but does not guarantee uninterrupted operation. Links to third-party sites are provided for reference and TELCOBRAS is not responsible for their content.",
        "It is not permitted to attempt unauthorized access to parts of the site, overload it, submit automated forms or impersonate another person.",
      ],
    },
    {
      id: "pqr",
      title: "13. Requests, complaints and claims",
      highlight: true,
      paragraphs: [
        `Clients may submit requests, complaints, claims and appeals through these channels: ${supportPhonesEn}, ${SUPPORT.emailDisplay} or at our office: ${CONTACT.address}. Each submission receives a filing number.`,
        "TELCOBRAS responds within 15 business days of receipt. Where the CRC User Rights Protection Regime applies, the client also has the rights that regime grants, including positive administrative silence if no timely response is received.",
      ],
    },
    {
      id: "ley",
      title: "14. Governing law and dispute resolution",
      paragraphs: [
        "These terms are governed by Colombian law, in particular Law 1341 of 2009 and the regulations of the Communications Regulation Commission where applicable. The parties first seek a direct settlement for 30 calendar days. If they do not reach one, the dispute is resolved before the courts of Cali, unless the contract provides another mechanism.",
      ],
    },
    {
      id: "cambios",
      title: "15. Changes to these terms",
      paragraphs: [
        "TELCOBRAS may update these terms. The current version is published on this page with its date. Changes affecting essential conditions of a contract in force are notified to the client at least 30 calendar days in advance and do not apply without the client's acceptance where the law requires it.",
      ],
    },
  ],
  related: {
    text: "Related documents:",
    links: [
      { to: "/sla", label: "SLA and warranties" },
      { to: "/politica-de-privacidad", label: "Privacy Policy" },
    ],
  },
};

export const termsContent = { es, en } as const;
