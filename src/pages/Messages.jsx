import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { getMessages, getConversation, markMessagesRead, getUserById } from '../utils/storage';
import { Mail } from 'lucide-react';
import './Messages.css';

export default function Messages() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [activeKey, setActiveKey] = useState(null);

  const threads = useMemo(() => {
    void refresh;
    const msgs = getMessages(user.id);
    const map = new Map();
    msgs.forEach((m) => {
      const otherId = m.fromUserId === user.id ? m.toUserId : m.fromUserId;
      const key = `${otherId}-${m.productId || 'general'}`;
      if (!map.has(key)) {
        map.set(key, { otherId, productId: m.productId, productTitle: m.productTitle, last: m, unread: 0 });
      }
      const t = map.get(key);
      if (new Date(m.createdAt) > new Date(t.last.createdAt)) t.last = m;
      if (m.toUserId === user.id && !m.read) t.unread += 1;
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.last.createdAt) - new Date(a.last.createdAt));
  }, [user.id, refresh]);

  const active = threads.find((t) => `${t.otherId}-${t.productId || 'general'}` === activeKey);
  const conversation = active
    ? getConversation(user.id, active.otherId, active.productId)
    : [];

  const openThread = (thread) => {
    const key = `${thread.otherId}-${thread.productId || 'general'}`;
    setActiveKey(key);
    markMessagesRead(user.id, thread.otherId);
    setRefresh((n) => n + 1);
  };

  return (
    <div className="messages-page">
      <Navbar />
      <div className="page-container messages-content">
        <h1 className="section-title">Inbox</h1>
        <p className="section-subtitle messages-sub">Message sellers directly without sharing personal contact info.</p>

        <div className="messages-layout card">
          <aside className="messages-threads">
            {threads.length > 0 ? threads.map((thread) => {
              const other = getUserById(thread.otherId);
              const key = `${thread.otherId}-${thread.productId || 'general'}`;
              return (
                <button
                  key={key}
                  type="button"
                  className={`thread-item ${activeKey === key ? 'active' : ''}`}
                  onClick={() => openThread(thread)}
                >
                  <strong>{other?.name || 'User'}</strong>
                  {thread.productTitle && <span className="thread-product">{thread.productTitle}</span>}
                  <p>{thread.last.body.slice(0, 60)}...</p>
                  {thread.unread > 0 && <span className="thread-unread">{thread.unread}</span>}
                </button>
              );
            }) : (
              <p className="messages-empty">No messages yet. Contact a seller from a product page.</p>
            )}
          </aside>

          <div className="messages-panel">
            {active ? (
              <>
                <div className="messages-panel-header">
                  <div>
                    <h2>{getUserById(active.otherId)?.name}</h2>
                    {active.productTitle && (
                      <Link to={`/software/${active.productId}`}>{active.productTitle}</Link>
                    )}
                  </div>
                </div>
                <div className="messages-list">
                  {conversation.map((m) => (
                    <div key={m.id} className={`message-bubble ${m.fromUserId === user.id ? 'sent' : 'received'}`}>
                      <p>{m.body}</p>
                      <time>{new Date(m.createdAt).toLocaleString('en-IN')}</time>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="messages-placeholder">
                <Mail size={48} />
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
