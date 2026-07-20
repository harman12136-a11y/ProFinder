import { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useMessageSync } from '../hooks/useMessageSync';
import { getMessages, getConversation, markMessagesRead, getUserById, sendMessage } from '../utils/storage';
import { resolveContextTitle, resolveContextLink } from '../utils/messageContext';
import { Mail, Send } from 'lucide-react';
import './Messages.css';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const syncKey = useMessageSync();
  const [activeKey, setActiveKey] = useState(null);
  const [draft, setDraft] = useState('');
  const handledToRef = useRef(null);
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  const threads = useMemo(() => {
    void syncKey;
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
  }, [user.id, syncKey]);

  const active = useMemo(() => {
    if (!activeKey) return null;
    const found = threads.find((t) => `${t.otherId}-${t.productId || 'general'}` === activeKey);
    if (found) return found;

    const to = searchParams.get('to');
    const product = searchParams.get('product');
    const titleParam = searchParams.get('title');
    if (to) {
      const expectedKey = product ? `${to}-${product}` : `${to}-general`;
      if (activeKey === expectedKey) {
        return {
          otherId: to,
          productId: product || null,
          productTitle: resolveContextTitle(product, titleParam),
        };
      }
    }

    if (activeKey.endsWith('-general')) {
      const otherId = activeKey.slice(0, -'-general'.length);
      return { otherId, productId: null, productTitle: null };
    }

    return null;
  }, [activeKey, threads, searchParams]);

  const conversation = useMemo(() => {
    if (!active) return [];
    void syncKey;
    return getConversation(user.id, active.otherId, active.productId);
  }, [active, user.id, syncKey]);

  const openThread = (thread) => {
    const key = `${thread.otherId}-${thread.productId || 'general'}`;
    setActiveKey(key);
    setDraft('');
    markMessagesRead(user.id, thread.otherId);
  };

  useEffect(() => {
    if (!activeKey && threads.length > 0 && !searchParams.get('to')) {
      const thread = threads[0];
      setActiveKey(`${thread.otherId}-${thread.productId || 'general'}`);
    }
  }, [threads, activeKey, searchParams]);

  useEffect(() => {
    const to = searchParams.get('to');
    const product = searchParams.get('product');
    if (!to || to === user.id) return;

    const key = product ? `${to}-${product}` : `${to}-general`;
    if (handledToRef.current === key) return;
    handledToRef.current = key;

    const thread = threads.find((t) => {
      if (t.otherId !== to) return false;
      return product ? t.productId === product : !t.productId;
    });

    if (thread) {
      setActiveKey(`${thread.otherId}-${thread.productId || 'general'}`);
      setDraft('');
      markMessagesRead(user.id, thread.otherId);
    } else {
      setActiveKey(key);
      setDraft('');
    }
  }, [searchParams, threads, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, activeKey]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;

    setDraft('');
    sendMessage({
      fromUserId: user.id,
      fromUserName: user.name,
      toUserId: active.otherId,
      productId: active.productId,
      productTitle: active.productTitle,
      subject: active.productTitle ? `Re: ${active.productTitle}` : 'Message',
      body: text,
    });
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
              const otherName = other?.name
                || (thread.last.fromUserId === thread.otherId ? thread.last.fromUserName : null)
                || 'User';
              const key = `${thread.otherId}-${thread.productId || 'general'}`;
              return (
                <button
                  key={key}
                  type="button"
                  className={`thread-item ${activeKey === key ? 'active' : ''}`}
                  onClick={() => openThread(thread)}
                >
                  <strong>{otherName}</strong>
                  {thread.productTitle && <span className="thread-product">{thread.productTitle}</span>}
                  <p>{thread.last.body.slice(0, 60)}{thread.last.body.length > 60 ? '...' : ''}</p>
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
                    <h2>
                      {getUserById(active.otherId)?.name
                        || threads.find((t) => t.otherId === active.otherId)?.last?.fromUserName
                        || 'User'}
                    </h2>
                    {active.productTitle && (() => {
                      const contextLink = resolveContextLink(active.productId);
                      return contextLink ? (
                        <Link to={contextLink}>{active.productTitle}</Link>
                      ) : (
                        <span className="thread-product">{active.productTitle}</span>
                      );
                    })()}
                  </div>
                </div>
                <div className="messages-list" ref={listRef}>
                  {conversation.map((m) => (
                    <div key={m.id} className={`message-bubble ${m.fromUserId === user.id ? 'sent' : 'received'}`}>
                      <p>{m.body}</p>
                      <time>{new Date(m.createdAt).toLocaleString('en-IN')}</time>
                    </div>
                  ))}
                  <div ref={bottomRef} className="messages-list-anchor" />
                </div>
                <form className="messages-compose" onSubmit={handleSend}>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message..."
                    aria-label="Message"
                  />
                  <button type="submit" className="btn btn-primary messages-send" disabled={!draft.trim()}>
                    <Send size={18} />
                    Send
                  </button>
                </form>
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
