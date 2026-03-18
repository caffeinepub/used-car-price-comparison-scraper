import { createContext, useContext } from "react";

export type AppRole = "buyer" | "dealer" | "admin" | null;

export type AppRoleContextValue = {
  role: AppRole;
  roleLoading: boolean;
};

export const AppRoleContext = createContext<AppRoleContextValue>({
  role: null,
  roleLoading: true,
});

export function useAppRoleContext(): AppRole {
  return useContext(AppRoleContext).role;
}

export function useRoleLoading(): boolean {
  return useContext(AppRoleContext).roleLoading;
}
