import { createContext, useContext } from "react";
export const StaffSessionVerified = createContext(false);
export const useStaffSessionVerified = () => useContext(StaffSessionVerified);

export const StaffPermissions = createContext<readonly string[] | null>(null);
export const useStaffPermissions = () => useContext(StaffPermissions);
