import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SelectedClientContextType {
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
}

const SelectedClientContext = createContext<SelectedClientContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
});

export const useSelectedClient = () => useContext(SelectedClientContext);

export const SelectedClientProvider = ({ children }: { children: ReactNode }) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(() => {
    return sessionStorage.getItem('selected_client_id');
  });

  useEffect(() => {
    if (selectedClientId) {
      sessionStorage.setItem('selected_client_id', selectedClientId);
    } else {
      sessionStorage.removeItem('selected_client_id');
    }
  }, [selectedClientId]);

  return (
    <SelectedClientContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </SelectedClientContext.Provider>
  );
};
