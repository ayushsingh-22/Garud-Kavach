/**
 * ChatbotWidget — a persistent floating chat assistant mounted once at the
 * app root. It reads the authenticated user's role from AuthContext, sends
 * messages to POST /api/chat, and handles `book_service` / `contact_request`
 * actions returned by the backend.
 *
 * Design tokens:
 *   Primary header / FAB  : #0A2540 (brand-dark navy)
 *   Gold accent            : #FFB700 (brand-gold)
 *   Interactive accent     : orange-600  (matches Navbar)
 *   Surfaces               : white / slate-900 (light/dark)
 *   Border radius          : rounded-2xl (10 px — matches --radius token)
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "../contexts/AuthContext";
import apiFetch from "../utils/apiFetch";

// ---------------------------------------------------------------------------
// Persona data — easy to edit later
// ---------------------------------------------------------------------------

const welcomeByRole = {
  guest:
    "Hi! I'm the Garud Kavach assistant. Ask me about our security services, pricing, or how to get in touch.",
  customer:
    "Welcome back! I can help you check your bookings, explore our services, or reach our support team.",
  hr: "Hi! I can help you with leave requests, headcount summaries, and attendance records. What do you need?",
  finance:
    "Hello! I can surface invoices, expense summaries, and financial reports for you. What would you like?",
  manager:
    "Hi! I can give you team overviews and active-project snapshots. What are you looking for?",
  superadmin:
    "Welcome, Admin. I have full access to system data, user management, and audit logs. How can I help?",
};

const chipsByRole = {
  guest: ["Book a service", "Contact us", "About Garud-Kavach"],
  customer: ["My bookings", "Available services", "Contact support"],
  hr: ["Pending leaves", "Headcount", "Today's attendance"],
  finance: ["Outstanding invoices", "This month's expenses", "Recent payments"],
  manager: ["My team", "Active projects"],
  superadmin: ["User list", "Audit logs", "System analytics"],
};

// Maps a chip label to the natural-language message sent to the API.
const chipMessages = {
  "Book a service": "I'd like to book a security service",
  "Contact us": "I'd like to get in touch with the team",
  "About Garud-Kavach": "Tell me about Garud Kavach and your services",
  "My bookings": "Show me my recent service bookings",
  "Available services": "What security services do you offer?",
  "Contact support": "I need to contact the support team",
  "Pending leaves": "Show the current pending leave requests",
  Headcount: "What is the current headcount?",
  "Today's attendance": "Show today's attendance summary",
  "Outstanding invoices": "Show outstanding invoices",
  "This month's expenses": "Show this month's expense summary",
  "Recent payments": "Show recent payment records",
  "My team": "Give me an overview of my team",
  "Active projects": "Show active security projects",
  "User list": "Show the list of registered users",
  "Audit logs": "Show recent audit log entries",
  "System analytics": "Show system analytics summary",
};

// ---------------------------------------------------------------------------
// Inline SVG icons (avoids an icon library dep)
// ---------------------------------------------------------------------------

function ChatIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ShieldIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Markdown component overrides — every element gets a clean, dedicated style.
// This replaces the previous "one giant prose className" approach so headings,
// tables, code, lists, links and quotes render legibly inside a chat bubble.
// ---------------------------------------------------------------------------

const markdownComponents = {
  // Paragraphs
  p: ({ children }) => (
    <p className="my-1.5 leading-relaxed first:mt-0 last:mb-0">{children}</p>
  ),

  // Headings — promoted h1/h2 inside a chat bubble shouldn't dominate, so we
  // visually compress everything into a tight, consistent scale.
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100 first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-2.5 mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100 first:mt-0">
      {children}
    </h4>
  ),
  h4: ({ children }) => (
    <h5 className="mt-2 mb-1 text-[13px] font-semibold text-slate-800 dark:text-slate-200 first:mt-0">
      {children}
    </h5>
  ),

  // Inline emphasis
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-slate-100">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => (
    <del className="line-through text-slate-500 dark:text-slate-400">
      {children}
    </del>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="my-1.5 pl-4 list-disc space-y-0.5 marker:text-slate-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1.5 pl-4 list-decimal space-y-0.5 marker:text-slate-500">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Links — always external, with word-break so long URLs don't overflow.
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-orange-600 dark:text-orange-400 hover:underline break-words"
    >
      {children}
    </a>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-orange-300 dark:border-orange-500/60 text-slate-600 dark:text-slate-300 italic">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,

  // Inline + block code. react-markdown v9 dropped the `inline` prop, so we
  // derive it from the className (block code carries `language-*`).
  code: ({ inline, className, children, ...props }) => {
    const isInline = inline ?? !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[12px] font-mono text-orange-700 dark:text-orange-300 break-words">
          {children}
        </code>
      );
    }
    return (
      <code
        className={`${className || ""} font-mono text-[12px] block`}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 p-3 rounded-lg bg-slate-900 dark:bg-black/40 text-slate-100 overflow-x-auto text-[12px] font-mono leading-relaxed">
      {children}
    </pre>
  ),

  // Tables — wrap in a horizontally scrollable container so wide HR / finance
  // data doesn't burst out of the chat bubble.
  table: ({ children }) => (
    <div className="my-2 -mx-1 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full text-[12px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
      {children}
    </tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children, style }) => (
    <th
      style={style}
      className="px-2.5 py-1.5 text-left font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td
      style={style}
      className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 align-top"
    >
      {children}
    </td>
  ),

  // Images — defensive sizing so a stray big image doesn't blow up the bubble.
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      className="my-2 max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-700"
    />
  ),
};

// ---------------------------------------------------------------------------
// TypingDots — animated "..." indicator
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <span
      className="flex items-center gap-1"
      role="status"
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ContactForm — inline form rendered inside a bot message bubble
// ---------------------------------------------------------------------------

function ContactForm({ form, onChange, onSubmit }) {
  if (form.success) {
    return (
      <div className="mt-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 px-4 py-3 text-sm text-green-800 dark:text-green-300">
        ✓ Message sent! We'll be in touch shortly.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 space-y-2"
      aria-label="Contact request form"
    >
      <input
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => onChange("name", e.target.value)}
        required
        maxLength={100}
        aria-label="Your name"
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition"
      />
      <input
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={(e) => onChange("email", e.target.value)}
        required
        aria-label="Your email"
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition"
      />
      <textarea
        placeholder="Your message"
        value={form.message}
        onChange={(e) => onChange("message", e.target.value)}
        required
        maxLength={1000}
        rows={3}
        aria-label="Your message"
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition resize-none"
      />
      {form.error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {form.error}
        </p>
      )}
      <button
        type="submit"
        disabled={form.loading}
        className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500"
      >
        {form.loading ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ActionChips — rendered under a bot message when actions are returned
// ---------------------------------------------------------------------------

function ActionChips({ actions, onBookService }) {
  if (!actions || actions.length === 0) return null;

  const bookActions = actions.filter((a) => a.type === "book_service");
  if (bookActions.length === 0) return null;

  return (
    <div
      className="mt-2 flex flex-wrap gap-2"
      role="group"
      aria-label="Suggested actions"
    >
      {bookActions.map((a, i) => (
        <button
          key={i}
          onClick={() => onBookService(a.payload?.serviceId)}
          className="text-xs px-3 py-1.5 rounded-full bg-[#FFB700] hover:bg-amber-500 text-[#0A2540] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500"
        >
          Book service →
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  onBookService,
  contactForm,
  onContactFormChange,
  onContactSubmit,
}) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-orange-600 text-white text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words"
          role="article"
          aria-label="Your message"
        >
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      {/* Bot avatar */}
      <div
        className="w-7 h-7 rounded-full bg-[#FFB700] flex items-center justify-center flex-shrink-0 mb-0.5"
        aria-hidden="true"
      >
        <ShieldIcon size={13} />
      </div>

      <div className="max-w-[88%] min-w-0 flex-1">
        <div
          className={`px-4 py-2.5 rounded-2xl rounded-bl-sm text-[13px] leading-relaxed shadow-sm break-words ${
            msg.isError
              ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          }`}
          role="article"
          aria-label="Assistant message"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {msg.text}
          </ReactMarkdown>
        </div>

        {/* action chips for book_service */}
        {!msg.isError && (
          <ActionChips actions={msg.actions} onBookService={onBookService} />
        )}

        {/* inline contact form if the backend returned a contact_request action */}
        {contactForm && !msg.isError && (
          <ContactForm
            form={contactForm}
            onChange={onContactFormChange}
            onSubmit={onContactSubmit}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChatbotWidget — main export
// ---------------------------------------------------------------------------

export default function ChatbotWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  // Conversation history for the API — [{role, content}]
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  // contactForm: { messageId, name, email, message, loading, error, success } | null
  const [contactForm, setContactForm] = useState(null);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const buttonRef = useRef(null);

  const role = user?.role || "guest";
  const chips = useMemo(() => chipsByRole[role] || chipsByRole.guest, [role]);

  // --- Clear conversation state when the user logs out ---
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setHistory([]);
      setHasGreeted(false);
      setContactForm(null);
    }
  }, [user]);

  // --- Welcome message: rendered once per session when the panel first opens ---
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: welcomeByRole[role] || welcomeByRole.guest,
          actions: [],
        },
      ]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, role]);

  // --- Scroll to latest message ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // --- Auto-focus input when the panel opens ---
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // --- Keyboard: ESC to close + focus trap ---
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Core send logic
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const msgId = `u_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: msgId, role: "user", text: trimmed, actions: [] },
      ]);
      setInput("");
      setIsLoading(true);

      // History snapshot at time of send (doesn't include the message just added)
      const historySnapshot = history;

      try {
        const res = await apiFetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history: historySnapshot }),
        });

        if (!res.ok) {
          const errText =
            res.status === 401
              ? "Please log in to use that feature."
              : res.status === 429
              ? "Too many messages. Please wait a moment."
              : res.status === 503
              ? "The AI assistant is currently busy. Please try again in a moment."
              : "Something went wrong. Please try again.";
          throw new Error(errText);
        }

        const data = await res.json();
        const assistantId = `a_${Date.now()}`;

        const assistantMsg = {
          id: assistantId,
          role: "assistant",
          text:
            data.reply || "I couldn't process your request. Please try again.",
          actions: data.actions || [],
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Advance history
        setHistory((prev) => [
          ...prev,
          { role: "user", content: trimmed },
          { role: "assistant", content: assistantMsg.text },
        ]);

        // If the backend returned a contact_request action with an empty payload,
        // open the inline contact form attached to this message.
        const hasContact = (data.actions || []).some(
          (a) => a.type === "contact_request"
        );
        if (hasContact) {
          setContactForm({
            messageId: assistantId,
            name: "",
            email: "",
            message: "",
            loading: false,
            error: null,
            success: false,
          });
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            text: err.message || "Network error. Please check your connection.",
            isError: true,
            actions: [],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [history, isLoading]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChipClick = (label) => {
    sendMessage(chipMessages[label] || label);
  };

  const handleBookService = (serviceId) => {
    setIsOpen(false);
    if (serviceId) {
      navigate(`/our-services?service=${encodeURIComponent(serviceId)}`);
    } else {
      navigate("/our-services");
    }
  };

  // Called by ContactForm onChange
  const handleContactFormChange = (field, value) => {
    setContactForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Submit contact form — POST the data back through /api/chat so the backend
  // email pipeline triggers when the LLM extracts a contact_request intent
  // with the payload fully populated.
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm) return;
    setContactForm((prev) => ({ ...prev, loading: true, error: null }));

    const structuredMessage =
      `Contact request — Name: ${contactForm.name}, ` +
      `Email: ${contactForm.email}, ` +
      `Message: ${contactForm.message}`;

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: structuredMessage, history }),
      });
      if (!res.ok) throw new Error("Failed to send. Please try again.");

      const data = await res.json();
      // Append the bot's confirmation reply
      const confirmId = `a_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: confirmId,
          role: "assistant",
          text: data.reply || "Thanks! We've received your message.",
          actions: [],
        },
      ]);
      setHistory((prev) => [
        ...prev,
        { role: "user", content: structuredMessage },
        { role: "assistant", content: data.reply || "" },
      ]);
      setContactForm((prev) => ({ ...prev, loading: false, success: true }));
    } catch (err) {
      setContactForm((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
    }
  };

  // ---------------------------------------------------------------------------
  // Whether to show quick-action chips (only while the conversation is fresh)
  // ---------------------------------------------------------------------------
  const showChips = messages.length <= 1 && !isLoading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* ── Floating action button ─────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={[
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center",
          "bg-[#0A2540] text-white",
          "hover:bg-[#0d3367] hover:shadow-xl",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500",
          "transition-all duration-200",
          isOpen ? "scale-90" : "scale-100",
        ].join(" ")}
      >
        {isOpen ? <CloseIcon size={22} /> : <ChatIcon size={22} />}
      </button>

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Garud Kavach Chat Assistant"
          className={[
            "fixed z-50 flex flex-col",
            // Mobile: full viewport sheet
            "inset-0",
            // Desktop: positioned panel — widened from 390 → 420 to give
            // tables and structured data more breathing room.
            "sm:inset-auto sm:bottom-24 sm:right-6",
            "sm:w-[420px] sm:h-[620px] sm:max-h-[calc(100vh-7rem)]",
            // Appearance
            "bg-white dark:bg-slate-900",
            "shadow-2xl",
            "sm:rounded-2xl",
            "overflow-hidden",
            "border border-slate-200 dark:border-slate-700",
            // Subtle entrance
            "animate-in fade-in slide-in-from-bottom-4 duration-200",
          ].join(" ")}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0A2540] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full bg-[#FFB700] flex items-center justify-center flex-shrink-0 shadow-sm"
                aria-hidden="true"
              >
                <ShieldIcon size={16} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">
                  Garud Assistant
                </p>
                <p className="text-slate-300 text-xs capitalize">
                  {role === "guest" ? "Ask me anything" : `${role} · Online`}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Close chat"
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-400"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* ── Message list ───────────────────────────────────────────────── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversation"
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onBookService={handleBookService}
                contactForm={
                  msg.role === "assistant" && contactForm?.messageId === msg.id
                    ? contactForm
                    : null
                }
                onContactFormChange={handleContactFormChange}
                onContactSubmit={handleContactSubmit}
              />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2" aria-hidden="true">
                <div className="w-7 h-7 rounded-full bg-[#FFB700] flex items-center justify-center flex-shrink-0">
                  <ShieldIcon size={12} />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* ── Quick-action chips (shown while conversation is empty) ──────── */}
          {showChips && (
            <div
              className="px-4 pb-2 flex flex-wrap gap-2"
              role="group"
              aria-label="Suggested quick actions"
            >
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-400"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* ── Input bar ──────────────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 px-3 py-3 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900"
          >
            <label htmlFor="chatbot-input" className="sr-only">
              Type a message
            </label>
            <input
              ref={inputRef}
              id="chatbot-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={isLoading}
              maxLength={2000}
              autoComplete="off"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="w-9 h-9 flex-shrink-0 rounded-xl bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-500 flex items-center justify-center"
            >
              <SendIcon size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}