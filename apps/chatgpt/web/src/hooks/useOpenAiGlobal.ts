import { useSyncExternalStore } from "react";

const SET_GLOBALS_EVENT_TYPE = "openai:set_globals";

export function useOpenAiGlobal<T = any>(key: string): T | undefined {
  return useSyncExternalStore(
    (onChange) => {
      const handleSetGlobal = () => onChange();
      window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal, { passive: true });
      return () => window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);
    },
    () => window.openai?.[key] as T | undefined,
    () => undefined
  );
}
