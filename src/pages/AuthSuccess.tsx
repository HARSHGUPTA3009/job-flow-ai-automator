import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishLogin = async () => {
      const res = await fetch(`${BACKEND_URL}/auth/status`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.authenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/signin", { replace: true });
      }
    };

    finishLogin();
  }, []);

  return <div>Signing you in...</div>;
}