// import { createContext, useEffect, useState } from "react";

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [authenticated, setAuthenticated] = useState(false);
//   const [registered, setRegistered] = useState(false);

//   useEffect(() => {
//     const savedUser = localStorage.getItem("user");

//     if (savedUser) {
//       const parsed = JSON.parse(savedUser);
//       setUser(parsed);
//       setAuthenticated(true);
//       setRegistered(!!parsed.registered);
//     }

//     setLoading(false);
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, setUser, loading, authenticated, setAuthenticated, registered, setRegistered }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };


import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      console.log("Restoring user from localStorage:", savedUser);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);

        setUser(parsed);
        setRegistered(!!parsed?.registered);
      }
    } catch (error) {
      console.error("Failed to restore user:", error);

      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const authenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        authenticated,
        registered,
        setRegistered,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};