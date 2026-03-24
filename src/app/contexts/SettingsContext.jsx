import { createContext, useState, useEffect } from "react";
import merge from "lodash/merge";
import { MatxLayoutSettings } from "app/components/MatxLayout/settings";

const STORAGE_KEY = "matx_settings_updates";

export const SettingsContext = createContext({
  settings: MatxLayoutSettings,
  updateSettings: () => {}
});

export default function SettingsProvider({ settings, children }) {
  const [currentSettings, setCurrentSettings] = useState(() => {
    try {
      const savedUpdates = localStorage.getItem(STORAGE_KEY);
      if (savedUpdates) {
        const parsedUpdates = JSON.parse(savedUpdates);
        return merge({}, MatxLayoutSettings, parsedUpdates);
      }
    } catch (error) {
      console.error("Error loading settings updates from localStorage:", error);
    }
    return settings || MatxLayoutSettings;
  });

  const handleUpdateSettings = (update = {}) => {
    const merged = merge({}, currentSettings, update);
    setCurrentSettings(merged);

    try {
      const existingUpdates = localStorage.getItem(STORAGE_KEY);
      const currentUpdates = existingUpdates ? JSON.parse(existingUpdates) : {};
      const newUpdates = merge({}, currentUpdates, update);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUpdates));
    } catch (error) {
      console.error("Error saving settings updates to localStorage:", error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newUpdates = JSON.parse(e.newValue);
          setCurrentSettings(merge({}, MatxLayoutSettings, newUpdates));
        } catch (error) {
          console.error("Error parsing settings updates from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings: currentSettings, updateSettings: handleUpdateSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
