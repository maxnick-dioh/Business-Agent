"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState([]);
  const STORAGE_KEY = "agentflow_conversation_v1";
  const [messagesLoaded, setMessagesLoaded] = useState(false);

useEffect(() => {
  try {
    const savedMessages = localStorage.getItem(STORAGE_KEY);

    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);

      if (
        Array.isArray(parsedMessages) &&
        parsedMessages.every(
          (item) =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
        )
      ) {
        setMessages(parsedMessages);
      }
    }
  } catch (error) {
    console.error("Could not load saved conversation:", error);
  } finally {
    setMessagesLoaded(true);
  }
}, []);
  useEffect(() => {
  if (!messagesLoaded) return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error("Could not save conversation:", error);
    setError("Could not save the conversation in this browser.");
  }
}, [messages, messagesLoaded]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(event) {
    event.preventDefault();

    const currentMessage = message.trim();

    if (!currentMessage || loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    const previousMessages = messages.slice(-10).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setMessages((previous) => [
      ...previous,
      { role: "user", content: currentMessage },
    ]);

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          history: previousMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
      setReply(data.reply);
    } catch (err) {
      setError(err.message || "Could not connect to the API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-icon">✦</span>
          <span>AgentFlow</span>
        </a>

        <p className="menu-label">WORKSPACE</p>

        <nav className="navigation">
          <a className="nav-link active" href="#overview">
            ◫ <span>Overview</span>
          </a>
          <a className="nav-link" href="#inbox">
            ✉ <span>Inbox</span>
          </a>
          <a className="nav-link" href="#channels">
            ◎ <span>Channels</span>
          </a>
          <a className="nav-link" href="#activity">
            ◷ <span>Activity</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">B</div>
            <div>
              <strong>Business Owner</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="main-content" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>AI Business Agent</h1>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            Agent is ready
          </div>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR BUSINESS, CONNECTED</p>
            <h2>Good evening, Boss 👋</h2>
            <p>
              Your business operations will be easier to manage from one place.
            </p>
          </div>

          <div className="welcome-icon">✦</div>
        </section>

        <section className="stats">
          <article className="stat-card">
            <span className="stat-icon">✉</span>
            <p>Total messages</p>
            <h3>0</h3>
            <small>Across all channels</small>
          </article>

          <article className="stat-card">
            <span className="stat-icon">◷</span>
            <p>Awaiting response</p>
            <h3>0</h3>
            <small>Messages to review</small>
          </article>

          <article className="stat-card">
            <span className="stat-icon">✦</span>
            <p>AI tasks completed</p>
            <h3>0</h3>
            <small>Completed automatically</small>
          </article>
        </section>

        <section className="section" id="channels">
          <div className="section-heading">
            <div>
              <h2>Communication channels</h2>
              <p>Manage your business conversations in one place.</p>
            </div>
            <span className="count">6 channels</span>
          </div>

          <div className="channel-grid">
            <article className="channel-card">
              <span className="channel-icon website">W</span>
              <div>
                <h3>Website</h3>
                <p>Website chat</p>
              </div>
              <span className="channel-status">Planned</span>
            </article>

            <article className="channel-card">
              <span className="channel-icon whatsapp">W</span>
              <div>
                <h3>WhatsApp</h3>
                <p>Customer messages</p>
              </div>
              <span className="channel-status">Planned</span>
            </article>

            <article className="channel-card">
              <span className="channel-icon facebook">f</span>
              <div>
                <h3>Facebook</h3>
                <p>Page messages</p>
              </div>
              <span className="channel-status">Planned</span>
            </article>

            <article className="channel-card">
              <span className="channel-icon instagram">◎</span>
              <div>
                <h3>Instagram</h3>
                <p>Direct messages</p>
              </div>
              <span className="channel-status">Planned</span>
            </article>

            <article className="channel-card">
              <span className="channel-icon telegram">➤</span>
              <div>
                <h3>Telegram</h3>
                <p>Bot conversations</p>
              </div>
              <span className="channel-status">Planned</span>
            </article>

            <article className="channel-card">
              <span className="channel-icon phone">☎</span>
              <div>
                <h3>Phone calls</h3>
                <p>Voice assistant</p>
              </div>
              <span className="channel-status">Planned</span>
            </article>
          </div>
        </section>

        <section className="section activity-section" id="activity">
          <div className="section-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Keep track of what your agent does.</p>
            </div>
          </div>

          <div className="empty-state" id="inbox">
            <div className="empty-icon">◷</div>
            <h3>Your activity will appear here</h3>
            <p>
              Messages, responses and completed tasks will appear here once we connect your agent.
            </p>
          </div>
        </section>

        <footer className="footer">
          AgentFlow · AI Business Agent
          <span>Built for your business</span>
        </footer>

        <section className="section" id="agent-chat">
          <div className="section-heading">
            <div>
              <h2>Test your AI Agent</h2>
              <p>Send a message to your local API.</p>
            </div>
          </div>

          <div className="empty-state">
            <form onSubmit={sendMessage} style={{ width: "100%", maxWidth: "600px" }}>
              <label
                htmlFor="agent-message"
                style={{
                  display: "block",
                  textAlign: "left",
                  marginBottom: "10px",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                Your message
              </label>

              <textarea
                id="agent-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type a message to your AI Business Agent..."
                maxLength={2000}
                rows={4}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  border: "1px solid #e1e7f0",
                  borderRadius: "10px",
                  resize: "vertical",
                  font: "inherit",
                  marginBottom: "12px",
                }}
              />

              <button
                type="submit"
                disabled={loading || !message.trim()}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#4776f5",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading || !message.trim() ? 0.6 : 1,
                }}
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>

            <div className="conversation">
              {messages.map((item, index) => (
                <div
                  key={`${index}-${item.role}`}
                  className={`message ${item.role}`}
                >
                  <strong>{item.role === "user" ? "You" : "AgentFlow"}</strong>
                  <p>{item.content}</p>
                </div>
              ))}

              {loading && <p>AgentFlow is thinking...</p>}
              {error && <p role="alert">{error}</p>}
            </div>

            {reply && (
              <div
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  marginTop: "24px",
                  padding: "16px",
                  background: "#eaf8ef",
                  borderRadius: "10px",
                  textAlign: "left",
                  overflowWrap: "anywhere",
                }}
              >
                <strong>Agent response</strong>
                <p style={{ marginTop: "10px", marginBottom: 0 }}>{reply}</p>
              </div>
            )}

            {error && (
              <p
                role="alert"
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  marginTop: "18px",
                  color: "#c62828",
                  overflowWrap: "anywhere",
                }}
              >
                {error}
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
