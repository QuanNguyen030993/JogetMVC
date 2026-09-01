import React, { useState, useEffect, useRef } from "react";
import appsettings from '../../../host.json';

export default function AspLogViewer() {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [logContent, setLogContent] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const logTerminalRef = useRef(null);

  const fetchFiles = async () => {
    try {
      
      setLoadingFiles(true);
      const res = await fetch(`${appsettings.UrlConfig.Host}/api/Utility/GetLogFiles`);
      if (!res.ok) throw new Error("Load log files list failed");
      const data = await res.json();
      setFiles(data || []);
      if (data && data.length > 0 && !selectedFile) {
        // Auto select today's or latest log file
        setSelectedFile(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchContent = async (file) => {
    if (!file) return;
    try {
      setLoadingContent(true);
      const res = await fetch(`${appsettings.UrlConfig.Host}/api/Utility/GetLogContent?filename=${encodeURIComponent(file.filename)}`);
      if (!res.ok) throw new Error("Load log content failed");
      const data = await res.json();
      setLogContent(data.content || "");
      // Scroll to bottom after loading new log content
      setTimeout(() => {
        if (logTerminalRef.current) {
          logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setLogContent(`[ERROR] Failed to load log file: ${err.message}`);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      fetchContent(selectedFile);
    }
  }, [selectedFile]);

  // Format file size nicely
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredFiles = files.filter(f =>
    f.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Parse lines and filter based on text search
  const logLines = logContent.split("\n");
  const filteredLines = logLines.filter(line => {
    if (!logSearch.trim()) return true;
    return line.toLowerCase().includes(logSearch.toLowerCase());
  });

  const downloadLogFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="asp-log-viewer" style={{ display: "flex", height: "calc(100vh - 120px)", gap: "20px", width: "100%" }}>
      {/* LEFT: LOG FILES LIST */}
      <div className="asp-log-files" style={{
        width: "320px",
        background: "white",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>ASP Daily Logs</h3>
          <button 
            onClick={fetchFiles}
            disabled={loadingFiles}
            style={{
              background: "#f1f5f9",
              color: "#475569",
              border: "none",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {loadingFiles ? "Reloading..." : "Reload"}
          </button>
        </div>

        <input
          placeholder="Filter logs by date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "0.9rem"
          }}
        />

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredFiles.map((file) => {
            const isSelected = selectedFile?.filename === file.filename;
            return (
              <div
                key={file.filename}
                onClick={() => setSelectedFile(file)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid",
                  borderColor: isSelected ? "#3b82f6" : "#e2e8f0",
                  background: isSelected ? "#eff6ff" : "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "0.95rem", color: isSelected ? "#1e40af" : "#1e293b" }}>
                    {file.date}
                  </strong>
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: isSelected ? "#3b82f6" : "#cbd5e1",
                    color: "white",
                    fontWeight: "600"
                  }}>
                    {formatBytes(file.size)}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.filename}
                </div>
              </div>
            );
          })}
          {filteredFiles.length === 0 && (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
              No log files found
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: LOG TERMINAL */}
      <div className="asp-log-terminal" style={{
        flex: 1,
        background: "#0f172a",
        borderRadius: "14px",
        border: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* TERMINAL HEADER */}
        <div style={{
          padding: "12px 18px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#1e293b"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }}></span>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }}></span>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></span>
            <strong style={{ marginLeft: "8px", color: "#94a3b8", fontSize: "0.9rem" }}>
              {selectedFile ? `${selectedFile.filename} - Live Viewer` : "Select a log file"}
            </strong>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              placeholder="Search content..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              style={{
                background: "#0f172a",
                color: "#e2e8f0",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "0.8rem",
                width: "180px"
              }}
            />
            <button
              onClick={() => fetchContent(selectedFile)}
              disabled={loadingContent || !selectedFile}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {loadingContent ? "Syncing..." : "Sync"}
            </button>
            <button
              onClick={downloadLogFile}
              disabled={!logContent}
              style={{
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Download
            </button>
          </div>
        </div>

        {/* TERMINAL CONTENT */}
        <div
          ref={logTerminalRef}
          style={{
            flex: 1,
            padding: "16px",
            overflow: "auto",
            fontFamily: "Consolas, Monaco, 'Courier New', monospace",
            fontSize: "0.85rem",
            lineHeight: "1.5",
            color: "#e2e8f0",
            whiteSpace: "pre-wrap"
          }}
        >
          {loadingContent ? (
            <div style={{ color: "#3b82f6", textAlign: "center", padding: "40px" }}>Streaming content...</div>
          ) : (
            filteredLines.map((line, idx) => {
              // Highlight log levels
              let color = "#e2e8f0";
              if (line.includes("[ERR]") || line.includes("Error") || line.includes("Exception") || line.includes("[FTL]")) {
                color = "#f87171"; // Red
              } else if (line.includes("[WRN]") || line.includes("Warning")) {
                color = "#fbbf24"; // Orange/Yellow
              } else if (line.includes("[INF]") || line.includes("Information")) {
                color = "#34d399"; // Green
              }

              return (
                <div key={idx} style={{ color, marginBottom: "2px" }}>
                  {line}
                </div>
              );
            })
          )}
          {!loadingContent && filteredLines.length === 0 && (
            <div style={{ color: "#64748b", textAlign: "center", padding: "40px" }}>
              Empty log file or no matches found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
