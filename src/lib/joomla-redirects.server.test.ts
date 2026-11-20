import { describe, expect, it } from "vitest";
import { joomlaResponse } from "./joomla-redirects";

function url(pathAndQuery: string): URL {
  return new URL(pathAndQuery, "https://telcobras.com");
}

function response(pathAndQuery: string): Response {
  const result = joomlaResponse(url(pathAndQuery));
  if (!result) throw new Error(`La URL ${pathAndQuery} no debería ser interceptada`);
  return result;
}

function location(pathAndQuery: string): string | null {
  return response(pathAndQuery).headers.get("location");
}

const PAGE = "option=com_sppagebuilder&view=page";

describe("redirecciones 301 desde Joomla", () => {
  it.each([
    ["104", "/"],
    ["98", "/#nosotros"],
    ["99", "/#servicios"],
    ["100", "/#proyectos"],
    ["107", "/#proyectos"],
    ["103", "/#contacto"],
  ])("sppagebuilder id=%s -> %s", (id, expected) => {
    expect(location(`/index.php?${PAGE}&id=${id}`)).toBe(expected);
  });

  it("comparan los parámetros sin importar el orden ni los extra", () => {
    expect(location(`/index.php?Itemid=101&id=98&lang=en&view=page&option=com_sppagebuilder`)).toBe(
      "/#nosotros",
    );
    expect(location(`/index.php?id=107&option=com_sppagebuilder&view=page&catid=9`)).toBe(
      "/#proyectos",
    );
    expect(location(`/index.php?view=page&id=104&option=com_sppagebuilder&Itemid=8`)).toBe("/");
  });

  it("artículo 62 de com_content -> política de privacidad, con cualquier orden y extra", () => {
    expect(location("/index.php?option=com_content&view=article&id=62")).toBe(
      "/politica-de-privacidad",
    );
    expect(location("/index.php?id=62&view=article&option=com_content&catid=12&Itemid=7")).toBe(
      "/politica-de-privacidad",
    );
    expect(location("/index.php?option=com_content&id=62&view=article&lang=en")).toBe(
      "/politica-de-privacidad",
    );
  });

  it("/index.php/contacto -> contacto (barra final y query incluidos)", () => {
    expect(location("/index.php/contacto")).toBe("/#contacto");
    expect(location("/index.php/contacto/")).toBe("/#contacto");
    expect(location("/index.php/contacto?lang=en&Itemid=5")).toBe("/#contacto");
  });

  it("cualquier otra URL /index.php o /index.php/... -> /", () => {
    expect(location("/index.php")).toBe("/");
    expect(location("/index.php?foo=bar")).toBe("/");
    expect(location("/index.php/otra-pagina")).toBe("/");
    expect(location("/index.php/contacto/equipo")).toBe("/");
    expect(location("/index.php?option=com_content&view=article&id=63")).toBe("/");
    expect(location("/index.php?option=com_sppagebuilder&view=page&id=999")).toBe("/");
    expect(location("/index.php?id=98")).toBe("/");
  });

  it.each([
    ["/", "104"],
    ["/#nosotros", "98"],
    ["/#servicios", "99"],
    ["/#proyectos", "100"],
    ["/#contacto", "103"],
    ["/politica-de-privacidad", "62"],
  ])("%s sale como 301 sin bucles", (target, id) => {
    const path =
      id === "62"
        ? `/index.php?option=com_content&view=article&id=${id}`
        : `/index.php?${PAGE}&id=${id}`;
    const result = response(path);
    expect(result.status).toBe(301);
    expect(result.headers.get("location")).toBe(target);
    expect(result.headers.get("location")?.startsWith("/index.php")).toBe(false);
  });

  it("/administrator y /administrator/... -> 404 sin Location", () => {
    for (const path of ["/administrator", "/administrator/", "/administrator/index.php"]) {
      const result = response(`${path}?option=com_login`);
      expect(result.status).toBe(404);
      expect(result.headers.get("location")).toBeNull();
    }
  });

  it("no afecta a rutas propias ni a rutas que solo empiezan parecido", () => {
    for (const path of [
      "/",
      "/admin",
      "/admin/papelera",
      "/api/contacto",
      "/assets/styles.css",
      "/politica-de-privacidad",
      "/terminos-de-servicio",
      "/sla",
      "/index.php-old",
      "/administratorius",
    ]) {
      expect(joomlaResponse(url(path))).toBeNull();
    }
  });
});
