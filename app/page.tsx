"use client";

import { useState } from "react";

export default function Home() {
  const [response, setResponse] = useState("No response yet");

  async function callServer() {
    const res = await fetch("/api/hello");
    const data = await res.json();
    setResponse(data.message);
  }

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Bakery Help Test</h1>

      <button onClick={callServer}>
        Send request to server
      </button>

      <p>Server reply: {response}</p>
    </div>
  );
}