import { beforeEach, describe, expect, it, vi } from "vitest";

type Sesion = {
  id: number;
  nombre: string;
  correo: string;
  rol: "administrador" | "comercial";
  debe_cambiar_password: number;
};

const sesion = vi.hoisted(() => ({ user: null as null | Sesion }));

vi.mock("./admin-session.server", () => ({
  getAdminSession: async () => sesion.user,
}));

const { requirePanelSession, requirePasswordChangeSession } = await import("./admin-guard");

beforeEach(() => {
  sesion.user = {
    id: 1,
    nombre: "Ada Admin",
    correo: "ada@example.invalid",
    rol: "administrador",
    debe_cambiar_password: 0,
  };
});

describe("debe_cambiar_password=1: solo Mi cuenta (y logout)", () => {
  it("el resto del panel redirige a Mi cuenta, pero Mi cuenta sí permite entrar", async () => {
    sesion.user!.debe_cambiar_password = 1;
    await expect(requirePanelSession()).rejects.toMatchObject({
      options: { to: "/admin/mi-cuenta" },
    });
    await expect(requirePasswordChangeSession()).resolves.toEqual({ user: sesion.user });
  });

  it("sin contraseña temporal el panel funciona con normalidad", async () => {
    await expect(requirePanelSession()).resolves.toEqual({ user: sesion.user });
    await expect(requirePasswordChangeSession()).resolves.toEqual({ user: sesion.user });
  });

  it("sin sesión válida todo redirige al login", async () => {
    sesion.user = null;
    await expect(requirePanelSession()).rejects.toMatchObject({
      options: { to: "/admin/login" },
    });
    await expect(requirePasswordChangeSession()).rejects.toMatchObject({
      options: { to: "/admin/login" },
    });
  });
});
