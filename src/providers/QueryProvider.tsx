"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, useEffect } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // 1. 初始化 Query Client，設定 Cache 壽命為 24 小時
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // Cache 保留 24 小時 (Garbage Collection Time)
        staleTime: 1000 * 10, // 10 秒內唔會重複背後 Fetch，節省資源
      },
    },
  }));

  // 2. Hydration 防護網：確保組件喺 Browser 載入完先啟動 Local Storage
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🌟 SSR 階段 (Server 渲染時)：因為無 window.localStorage，我哋畀個普通 Provider 佢
  if (!isMounted) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  // 🌟 Client 階段 (Browser 運行時)：正式啟動 Local Storage 備份機制
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
  });

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ 
        persister,
        maxAge: 1000 * 60 * 60 * 24, // Local Storage 檔案有效期 24 小時
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}