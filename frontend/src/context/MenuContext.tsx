import React, { createContext, useState, useContext } from "react";

interface MenuContextType {
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  toggleMenu: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  return (
    <MenuContext.Provider value={{ showMenu, setShowMenu, toggleMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu(): MenuContextType {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}
