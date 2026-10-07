import { useState } from "react";
import { toast } from "sonner";
import { CALI_PHOTO, LOGO_URL, CONTACT } from "@/lib/telcobras-data";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { Facebook, Instagram, Linkedin } from "lucide-react";

export function ContactAndFooter() {
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    cargo: "",
    correo: "",
    telefono: "",
    servicio: "Conectividad (Fibra & Radioenlace)",
    mensaje: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.correo || !formData.telefono) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }
    setFormSubmitted(true);
    toast.success(
      "¡Gracias! Tu solicitud ha sido enviada con éxito. Un consultor se comunicará en menos de 24 horas.",
    );
  };

  return (
    <>
      {/* 9. CONTACTO Y FORMULARIO */}
      <section
        id="contacto"
        className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 z-0 opacity-15">
          <img src={CALI_PHOTO} alt="Sede TELCOBRAS Cali" className="w-full h-full object-cover" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#88BD4C]/20 text-[#88BD4C] text-xs font-extrabold uppercase tracking-wider">
                  Atención Inmediata B2B
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                  Hablemos de las necesidades tecnológicas de tu empresa
                </h2>
                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                  Completa el formulario y un asesor técnico especializado se pondrá en contacto
                  contigo para conversar sobre tu proyecto.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="p-3 rounded-xl bg-[#0087C3] text-white">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Línea de Atención Comercial
                    </p>
                    <a
                      href={CONTACT.phoneHref}
                      className="text-base font-bold text-white hover:text-[#88BD4C] transition-colors"
                    >
                      {CONTACT.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="p-3 rounded-xl bg-[#88BD4C] text-slate-950">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Correo Electrónico Directo
                    </p>
                    <a
                      href={CONTACT.emailHref}
                      className="text-base font-bold text-white hover:text-[#88BD4C] transition-colors"
                    >
                      {CONTACT.emailDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="p-3 rounded-xl bg-[#F3CB35] text-slate-950">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Sede Principal Corporativa
                    </p>
                    <p className="text-sm font-bold text-white">{CONTACT.address}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Síguenos en redes sociales:
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.facebook.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-[#0087C3] hover:border-[#0087C3] transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-[#0087C3] hover:border-[#0087C3] transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.linkedin.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-[#0087C3] hover:border-[#0087C3] transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-100">
                {formSubmitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">¡Solicitud Recibida!</h3>
                    <p className="text-slate-600 text-sm max-w-md mx-auto">
                      Hemos asignado tu requerimiento a nuestro equipo de ingeniería comercial. Te
                      contactaremos al teléfono indicado o a tu correo corporativo en menos de 24
                      horas.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#0087C3]"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                      Solicitud de Cotización o Diagnóstico
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mb-4">
                      Ingresa tus datos corporativos para entregarte una propuesta a la medida.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre Completo *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="Ej. Carlos Mendoza"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0087C3]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre de la Empresa
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Ej. Grupo Industrial S.A."
                            value={formData.empresa}
                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0087C3]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cargo en la empresa
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Ej. Director de TI / Gerente Operaciones"
                            value={formData.cargo}
                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0087C3]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Correo Electrónico *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="email"
                            required
                            placeholder="carlos@tuempresa.com"
                            value={formData.correo}
                            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0087C3]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Teléfono / WhatsApp *
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="tel"
                            required
                            placeholder="+57 300 000 0000"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0087C3]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Servicio de Interés
                        </label>
                        <select
                          value={formData.servicio}
                          onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0087C3]"
                        >
                          <option>Conectividad (Fibra & Radioenlace)</option>
                          <option>Seguridad Sincronizada & Ciberdefensa</option>
                          <option>Colaboración & Trabajo Híbrido</option>
                          <option>Nube Híbrida & Almacenamiento</option>
                          <option>Inteligencia Artificial integrada</option>
                          <option>Agentes con Inteligencia Artificial</option>
                          <option>Solución Integral a la Medida</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Detalles de tu requerimiento
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Cuéntanos brevemente la ubicación, sedes o necesidades técnicas de tu empresa..."
                        value={formData.mensaje}
                        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0087C3]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl text-sm font-extrabold text-white bg-[#0087C3] hover:bg-[#006BA4] shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Enviar Solicitud de Cotización
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿DÓNDE ESTAMOS? */}
      <section id="ubicacion" className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full bg-[#0087C3]/10 text-[#0087C3] text-xs font-extrabold uppercase tracking-wider">
              Encuéntranos
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              ¿Dónde estamos?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              Visítanos en nuestra sede principal en Cali.
            </p>
            <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-bold">
              <MapPin className="w-4 h-4 text-[#88BD4C]" />
              {CONTACT.address}
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/60">
            <iframe
              title="Ubicación TELCOBRAS S.A.S. en Cali"
              src="https://www.google.com/maps?q=Carrera+83A+%23+20+-+20,+Cali,+Colombia&output=embed"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-[300px] md:h-[400px] w-full block"
            />
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Carrera+83A+%23+20+-+20,+Cali,+Colombia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold text-white bg-[#0087C3] hover:bg-[#006BA4] shadow-md shadow-sky-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Navigation className="w-4 h-4 mr-2" /> Cómo llegar
            </a>
          </div>
        </div>
      </section>

      {/* 10. PIE DE PÁGINA */}
      <footer className="bg-[#0A192F] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            {/* Logo oficial transparente sobre fondo oscuro */}
            <div className="inline-flex items-center">
              <img
                src={LOGO_URL}
                alt="TELCOBRAS S.A.S. Logo"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div className="text-center md:text-right">
              <p className="text-xs sm:text-sm font-extrabold text-white tracking-widest uppercase">
                Innovación • Compromiso • Resultados
              </p>
              <p className="text-xs text-slate-400 mt-1">
                TELCOBRAS S.A.S. © {new Date().getFullYear()} — Todos los derechos reservados.
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-4">
            <p>Sede Principal: Carrera 83A # 20 - 20, Cali, Valle del Cauca - Colombia</p>
            <div className="flex gap-6">
              <a href="#contacto" className="hover:text-white transition-colors">
                Términos de Servicio
              </a>
              <a href="#contacto" className="hover:text-white transition-colors">
                Política de Tratamiento de Datos
              </a>
              <a href="#contacto" className="hover:text-white transition-colors">
                SLA & Garantías
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
