export async function cleanupSession() {
  try {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      
      const cookies = document.cookie.split(";");
      
      for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        if (name.startsWith("next-auth") || name.startsWith("__Secure-next-auth")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    }
  } catch (error) {
    console.error("Session cleanup error:", error);
  }
}

export async function performLogout() {
  await cleanupSession();
  
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}