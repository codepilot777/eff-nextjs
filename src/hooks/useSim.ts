"use client";
import { useEffect, useRef, useState } from "react";

export function useSim() {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<string>("等待數據中...");

  useEffect(() => {
    const savedWsUrl = typeof window !== 'undefined' ? localStorage.getItem("ios_fsuipc_url") : null;
    const WS_URL = savedWsUrl || "ws://localhost:2048/fsuipc"; 
    
    console.log(`🔌 [P3D LINK] Attempting connection to: ${WS_URL}`);
    
    const ws = new WebSocket(WS_URL, "fsuipc");
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("🚀 [P3D LINK] Connected successfully!");
      ws.send(JSON.stringify({
        command: "offsets.declare", name: "readData",
        offsets: [
          { name: "aircraftTitle", address: 0x3D00, type: "string", size: 256 },
          { name: "ias", address: 0x02BC, type: "int", size: 4 }
        ]
      }));
      ws.send(JSON.stringify({
        command: "offsets.declare", name: "controlPort",
        offsets: [
          { name: "param", address: 0x3114, type: "int", size: 4 },
          { name: "control", address: 0x3110, type: "int", size: 4 },
          { name: "directPause", address: 0x0262, type: "int", size: 2 }
        ]
      }));
      ws.send(JSON.stringify({
        command: "offsets.declare", name: "weatherPort",
        offsets: [{ name: "metarString", address: 0xB000, type: "string", size: 256 }]
      }));
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.command === "offsets.read" && data.success) {
          setTelemetry(JSON.stringify(data.data, null, 2));
        }
      } catch (e) { console.error("Message parse error", e); }
    };

    ws.onclose = () => setIsConnected(false);
    return () => ws.close();
  }, []);

  const readSimData = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ command: "offsets.read", name: "readData" }));
  };

  const sendToFSUIPC = (payload: any) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify(payload));
  };

  return { isConnected, telemetry, readSimData, sendToFSUIPC };
}