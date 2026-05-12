import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!rawBody) {
    return {
      data: null,
      message: response.ok ? "" : "Empty response from server."
    };
  }

  if (contentType.includes("application/json")) {
    try {
      const data = JSON.parse(rawBody);
      return {
        data,
        message: data?.message || ""
      };
    } catch (_error) {
      return {
        data: null,
        message: "Server returned invalid JSON."
      };
    }
  }

  return {
    data: null,
    message: rawBody
  };
}

function extractEmailsFromText(value) {
  const matches = String(value || "").match(emailPattern) || [];
  return Array.from(new Set(matches.map((email) => email.toLowerCase())));
}

function extractEmailsFromWorkbook(file) {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const foundEmails = new Set();

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        blankrows: false
      });

      rows.flat().forEach((cell) => {
        extractEmailsFromText(cell).forEach((email) => foundEmails.add(email));
      });
    });

    return Array.from(foundEmails);
  });
}

function formatDate(value) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusLabel(status) {
  switch (status) {
    case "success":
      return "Delivered";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    default:
      return "Queued";
  }
}

export default function App() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [manualRecipients, setManualRecipients] = useState("");
  const [uploadedRecipients, setUploadedRecipients] = useState([]);
  const [uploadFileName, setUploadFileName] = useState("");
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const manualRecipientList = useMemo(
    () => extractEmailsFromText(manualRecipients),
    [manualRecipients]
  );

  const totalRecipients = useMemo(() => {
    return new Set([...manualRecipientList, ...uploadedRecipients]).size;
  }, [manualRecipientList, uploadedRecipients]);

  async function loadHistory() {
    setHistoryLoading(true);

    try {
      const response = await fetch("/api/history");
      const { data, message } = await parseApiResponse(response);

      if (!response.ok) {
        throw new Error(message || "Could not load history.");
      }

      setHistory(data?.history || []);
    } catch (error) {
      setStatus({
        type: "error",
        text: error.message
      });
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleFileChange(file) {
    if (!file) {
      setUploadFileName("");
      setUploadedRecipients([]);
      return;
    }

    try {
      const emails = await extractEmailsFromWorkbook(file);

      setUploadFileName(file.name);
      setUploadedRecipients(emails);
      setStatus({
        type: "success",
        text: `${emails.length} recipient emails loaded from ${file.name}.`
      });
    } catch (_error) {
      setUploadFileName("");
      setUploadedRecipients([]);
      setStatus({
        type: "error",
        text: "The file could not be read. Upload a valid Excel or CSV file."
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!subject.trim() || !body.trim()) {
      setStatus({
        type: "error",
        text: "Enter both a subject and the email body."
      });
      return;
    }

    if (totalRecipients === 0) {
      setStatus({
        type: "error",
        text: "Add recipient emails manually or upload an Excel/CSV file."
      });
      return;
    }

    setSending(true);
    setStatus({
      type: "info",
      text: "Sending emails now..."
    });

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject,
          body,
          manualRecipients,
          uploadedRecipients,
          uploadFileName
        })
      });

      const { data, message } = await parseApiResponse(response);

      if (!response.ok) {
        const invalids = data?.invalidRecipients?.length
          ? ` Invalid: ${data.invalidRecipients.join(", ")}`
          : "";

        throw new Error((message || "Sending failed.") + invalids);
      }

      setStatus({
        type: data.record.status === "success" ? "success" : "warning",
        text: data.message
      });
      setSubject("");
      setBody("");
      setManualRecipients("");
      setUploadedRecipients([]);
      setUploadFileName("");
      await loadHistory();
    } catch (error) {
      setStatus({
        type: "error",
        text: error.message
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />

      <main className="app-frame">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Bulk Mail App</p>
            <h1>Send Gmail campaigns from one clean dashboard.</h1>
            <p className="hero-text">
              Write your message, upload an Excel or CSV list, and track what
              was sent in MongoDB-backed history.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span className="stat-value">{manualRecipientList.length}</span>
              <span className="stat-label">Manual emails</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{uploadedRecipients.length}</span>
              <span className="stat-label">File emails</span>
            </div>
            <div className="stat-card accent-card">
              <span className="stat-value">{totalRecipients}</span>
              <span className="stat-label">Total unique recipients</span>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <form className="composer-card" onSubmit={handleSubmit}>
            <div className="section-heading">
              <div>
                <p className="section-kicker">Compose</p>
                <h2>Build your bulk email</h2>
              </div>
              <span className="chip">Gmail + MongoDB</span>
            </div>

            <label className="field">
              <span>Subject</span>
              <input
                type="text"
                placeholder="Monthly product update"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Email body</span>
              <textarea
                rows="8"
                placeholder="Write the message you want to send..."
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Recipient emails</span>
              <textarea
                rows="5"
                placeholder="name1@gmail.com, name2@gmail.com"
                value={manualRecipients}
                onChange={(event) => setManualRecipients(event.target.value)}
              />
              <small>
                Separate emails with commas, semicolons, or new lines.
              </small>
            </label>

            <div className="upload-panel">
              <div>
                <p className="section-kicker">Upload sheet</p>
                <h3>Import Excel or CSV recipients</h3>
                <p className="upload-text">
                  The app scans your file and extracts every email address it
                  finds.
                </p>
              </div>

              <label className="upload-dropzone">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] || null)
                  }
                />
                <span>{uploadFileName || "Choose or drop a file here"}</span>
                <strong>
                  {uploadedRecipients.length > 0
                    ? `${uploadedRecipients.length} emails ready`
                    : "Excel (.xlsx, .xls) or CSV"}
                </strong>
              </label>
            </div>

            {status ? (
              <div className={`status-banner ${status.type}`}>{status.text}</div>
            ) : null}

            <button className="send-button" type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send Bulk Email"}
            </button>
          </form>

          <aside className="history-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">History</p>
                <h2>Recent mail activity</h2>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={loadHistory}
                disabled={historyLoading}
              >
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <p className="empty-state">Loading email history...</p>
            ) : history.length === 0 ? (
              <p className="empty-state">
                No emails sent yet. Your recent activity will appear here.
              </p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <article className="history-item" key={item._id}>
                    <div className="history-topline">
                      <h3>{item.subject}</h3>
                      <span className={`badge ${item.status}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="history-meta">
                      {item.totalRecipients} recipients
                      {item.uploadFileName ? ` - ${item.uploadFileName}` : ""}
                    </p>
                    <p className="history-meta">
                      Sent: {item.acceptedRecipients?.length || 0} - Failed:{" "}
                      {item.failedRecipients?.length || 0}
                    </p>
                    <p className="history-time">{formatDate(item.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
