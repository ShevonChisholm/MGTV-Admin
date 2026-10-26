import BrandLogo from "../components/BrandLogo";
import StaffWelcome from "../pages/StaffWelcome";
import { StaffSessionVerified } from "../api/staff-session-context";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  ApiError,
  STAFF_SESSION_ENDED,
  STAFF_ONBOARDING_REQUIRED,
} from "../api/client";
import { useRouter } from "../router";
import StaffAuth from "../pages/StaffAuth";
const actions = [
  "sign-in",
  "accept-invite",
  "forgot-password",
  "reset-password",
] as const;
export default function StaffSessionBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const { route, navigate } = useRouter();
  const [state, setState] = useState<
    "checking" | "ready" | "onboarding" | "signed-out" | "error"
  >("checking");
  const serial = useRef(0),
    mounted = useRef(true);
  const action =
    route.section === "auth"
      ? (actions.find((a) => a === route.parts[0]) ?? "sign-in")
      : null;
  const refresh = useCallback(async () => {
    const s = ++serial.current;
    try {
      const session = await api("/admin/session");
      if (mounted.current && s === serial.current)
        setState(session.onboardingRequired ? "onboarding" : "ready");
    } catch (error) {
      if (mounted.current && s === serial.current)
        setState(
          error instanceof ApiError && error.status === 401
            ? "signed-out"
            : "error",
        );
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      serial.current++;
    };
  }, []);
  useEffect(() => {
    if (!action) void refresh();
  }, [route.path, action, refresh]);
  useEffect(() => {
    const ended = () => {
      serial.current++;
      setState("signed-out");
    };
    const focus = () => {
      if (!action && document.visibilityState === "visible") void refresh();
    };
    const onboarding = () => {
      serial.current++;
      setState("onboarding");
    };
    window.addEventListener(STAFF_ONBOARDING_REQUIRED, onboarding);
    window.addEventListener(STAFF_SESSION_ENDED, ended);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    const timer = window.setInterval(focus, 60000);
    return () => {
      window.removeEventListener(STAFF_ONBOARDING_REQUIRED, onboarding);
      window.removeEventListener(STAFF_SESSION_ENDED, ended);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      clearInterval(timer);
    };
  }, [action, refresh]);
  if (
    !action &&
    (state === "onboarding" ||
      (state === "ready" && route.section === "welcome"))
  )
    return <StaffWelcome onCompleted={refresh} />;
  if (action || state !== "ready")
    return (
      <main
        className="staff-auth-layout"
        aria-label="MGTV staff authentication"
      >
        {action || state === "signed-out" ? (
          <StaffAuth
            key={action ?? "sign-in"}
            action={action ?? "sign-in"}
            onAuthenticated={async () => {
              if (action) {
                navigate("/admin/dashboard", { replace: true });
              }
              await refresh();
            }}
          />
        ) : (
          <section
            className="staff-auth staff-session-state"
            aria-busy={state === "checking"}
          >
            <div className="staff-brand">
              <BrandLogo width={128} /><span>THE PEOPLE BEHIND THE STORIES</span>
            </div>
            <h1>
              {state === "checking"
                ? "Checking your staff session"
                : "We couldn’t verify your session"}
            </h1>
            <p role={state === "checking" ? "status" : "alert"}>
              {state === "checking"
                ? "Your workspace will open after secure access is confirmed."
                : "Check your connection and try again. Your workspace stays closed until access is verified."}
            </p>
            {state === "checking" ? (
              <div aria-hidden="true" className="staff-session-skeleton">
                <span />
                <span />
                <span />
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setState("checking");
                  void refresh();
                }}
              >
                Try again
              </button>
            )}
          </section>
        )}
      </main>
    );
  return (
    <StaffSessionVerified.Provider value={true}>
      {children}
    </StaffSessionVerified.Provider>
  );
}
