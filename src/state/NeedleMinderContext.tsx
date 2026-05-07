import { createContext, PropsWithChildren, useContext } from "react";

import { useNeedleMinderStore } from "./useNeedleMinderStore";

type NeedleMinderStore = ReturnType<typeof useNeedleMinderStore>;

const NeedleMinderContext = createContext<NeedleMinderStore | null>(null);

export function NeedleMinderProvider({ children }: PropsWithChildren) {
  const store = useNeedleMinderStore();
  return <NeedleMinderContext.Provider value={store}>{children}</NeedleMinderContext.Provider>;
}

export function useNeedleMinder() {
  const store = useContext(NeedleMinderContext);
  if (!store) {
    throw new Error("useNeedleMinder must be used within NeedleMinderProvider.");
  }

  return store;
}
