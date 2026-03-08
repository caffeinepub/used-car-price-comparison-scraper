import { createContext, useContext } from "react";

export type AppRole = "buyer" | "dealer" | "admin" | null;

export const AppRoleContext = createContext<AppRole>(null);

export function useAppRoleContext(): AppRole {
  return useContext(AppRoleContext);
}
