import { useEffect, useState } from "react";

export default function App() {
  const [logs, setLogs] = useState([]);

  async function fetchLogs() {
    const res = await fetch("http://localhost:3000/logs");

    console.log(res);

    const data = await res.json();
    setLogs(data);
  }

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>🛡 Sentinel — AI Log Viewer</h2>

      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <b>{log.service}</b> — {log.level}
          <p>
            <b>Error:</b> {log.message}
          </p>
          <p>
            <b>AI Summary:</b> {log.summary}
          </p>
          <small>{log.timestamp}</small>
        </div>
      ))}
    </div>
  );
}
