import { QueryClient } from "@tanstack/react-query";
import { isNetworkError } from "@/lib/network";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // No signal → skip the retry cycle so the stored copy on the device is
  // used immediately instead of every screen waiting through retries.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) =>
          isNetworkError(error) ? false : failureCount < 2,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
