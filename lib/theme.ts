export const THEME_STORAGE_KEY = "stacksight-theme";

// Inlined into <head> so a stored light preference is applied before first paint.
// Dark is the default (see docs/ui-spec.md), so <html> is server-rendered with `dark`.
export const themeInitScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;
