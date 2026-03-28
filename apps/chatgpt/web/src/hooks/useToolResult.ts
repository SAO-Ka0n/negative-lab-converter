import { useEffect, useState } from "react";
import { useOpenAiGlobal } from "./useOpenAiGlobal";

export function useToolResult<T = any>() {
  const toolOutput = useOpenAiGlobal<T>("toolOutput");
  const [toolResult, setToolResult] = useState<T | undefined>(toolOutput);

  useEffect(() => {
    if (toolOutput !== undefined) {
      setToolResult(toolOutput);
    }
  }, [toolOutput]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.method !== "ui/notifications/tool-result") return;
      setToolResult(message.params?.structuredContent ?? message.params);
    };

    window.addEventListener("message", onMessage, { passive: true });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return toolResult;
}
