// In production, VITE_API_URL points to the deployed backend.
// In dev, leave it empty so all requests go through the Vite proxy
// (works from localhost AND from any LAN device via the network IP).
const baseURL = import.meta.env.VITE_API_URL || "";

export default baseURL;
