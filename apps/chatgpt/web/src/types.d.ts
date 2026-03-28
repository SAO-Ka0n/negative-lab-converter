declare global {
  interface Window {
    __NLC_WIDGET_BASE_URL__?: string;
    openai?: {
      toolOutput?: any;
      uploadFile?: (file: File, options?: { library?: boolean }) => Promise<{ fileId: string }>;
      getFileDownloadUrl?: (input: { fileId: string }) => Promise<{ downloadUrl: string }>;
      callTool?: (name: string, args: Record<string, unknown>) => Promise<any>;
      [key: string]: any;
    };
  }
}

export {};
