import { createContext, useContext } from "react";
export const StaffSessionVerified = createContext(false);
export const useStaffSessionVerified = () => useContext(StaffSessionVerified);
