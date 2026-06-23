import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Admin from "./pages/Admin";
import Transporter from "./pages/Transporter";
import Warga from "./pages/Warga";
import Login from "./pages/Login";

export default function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get current user session
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setRole("guest");
          setLoading(false);
          return;
        }

        // Get user role from profiles table
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() - won't error if no data

        console.log("Profile data:", { data, error, userId: user.id });

        if (error) {
          console.error("❌ Error fetching profile - Full Details:", {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.details,
            hint: error.hint,
            userId: user.id,
            fullError: error,
          });
          // Default ke warga jika profile belum ada atau error
          console.warn("⚠️ Defaulting to 'warga' role");
          setRole("warga");
        } else if (data && data.role) {
          console.log("✅ Setting role to:", data.role);
          setRole(data.role);
        } else {
          console.warn("⚠️ No role found in profile, defaulting to warga");
          console.warn(
            "Profile data was null. User might have just registered.",
          );
          setRole("warga");
        }
      } catch (err) {
        console.error("❌ Unexpected error during getUser:", {
          message: err.message,
          stack: err.stack,
          fullError: err,
        });
        setRole("guest");
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <h2 style={{ color: "#1f2937" }}>Loading...</h2>
      </div>
    );
  }

  if (role === "guest") return <Login />;
  if (role === "admin") return <Admin />;
  if (role === "transporter") return <Transporter />;

  return <Warga />;
}
