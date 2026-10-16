import { createServerFn } from "@tanstack/react-start";

import { getRequestHeader } from "@tanstack/react-start/server";
import { readAccessibilityPreferencesCookie } from "./accessibility-preferences";

export const getAccessibilityPreferences = createServerFn({ method: "GET" }).handler(() =>
  readAccessibilityPreferencesCookie(getRequestHeader("cookie")),
);
