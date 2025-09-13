import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase Client

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true); // <<-- Revisi: Tambah state loading
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // <<-- Revisi: Ganti Socket.io dengan Supabase Realtime
  useEffect(() => {
    if (!user) return;
    
    // Load chat history saat komponen dimuat
    loadChatHistory();

    // Supabase Realtime untuk mendengarkan pesan baru
    const chatChannel = supabase
      .channel(`public:messages`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        (payload) => {
          const newMessage = payload.new;
          if (newMessage.sender_id === 'e499cfd5-d4e5-4b35-8667-e987c0e5a80d') { // <<-- Revisi: Ganti ID admin dengan UUID
            setMessages(prev => [...prev, {
              ...newMessage,
              isOwn: false
            }]);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const adminId = 'e499cfd5-d4e5-4b35-8667-e987c0e5a80d'; // <<-- Revisi: Ganti ID admin dengan UUID
      // <<-- Revisi: Ganti fetch dengan Supabase
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${adminId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${adminId})`)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }

      setMessages(data.map(msg => ({
        ...msg,
        isOwn: msg.sender_id === user.id
      })));
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = (e, message) => {
    e.preventDefault();
    if (message.sender_id !== user.id) return;
    
    setSelectedMessage(message);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleEditMessage = () => {
    setEditingMessage(selectedMessage.id); // <<-- Revisi: Ganti message_id dengan id
    setEditText(selectedMessage.message);
    setShowContextMenu(false);
  };

  const handleDeleteMessage = async () => {
    try {
      // <<-- Revisi: Ganti fetch dengan Supabase
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', selectedMessage.id); // <<-- Revisi: Ganti message_id dengan id

      if (error) {
        throw error;
      }
      await loadChatHistory();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
    setShowContextMenu(false);
  };

  const handleSaveEdit = async () => {
    try {
      // <<-- Revisi: Ganti fetch dengan Supabase
      const { error } = await supabase
        .from('messages')
        .update({ message: editText, is_edited: true })
        .eq('id', editingMessage);

      if (error) {
        throw error;
      }
      await loadChatHistory();
    } catch (error) {
      console.error('Error editing message:', error);
    }
    setEditingMessage(null);
  };

  const sendMessage = async (e) => { // <<-- Revisi: Tambah async
    e.preventDefault();
    
    if (newMessage.trim()) {
      const messageData = {
        sender_id: user.id,
        receiver_id: 'e499cfd5-d4e5-4b35-8667-e987c0e5a80d', // <<-- Revisi: Ganti ID admin dengan UUID
        message: newMessage.trim()
      };
      
      // <<-- Revisi: Ganti socket.emit dengan Supabase
      const { error } = await supabase
        .from('messages')
        .insert(messageData);
      
      if (error) {
        console.error('Error sending message:', error);
      } else {
        setNewMessage('');
        // Data akan diperbarui otomatis oleh Realtime Supabase
      }
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle"></i> Silakan login terlebih dahulu untuk menggunakan chat.
        </div>
      </div>
    );
  }
  
  // <<-- Revisi: Hapus isConnected state karena tidak lagi pakai socket.io

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <div className="d-flex align-items-center">
                <i className="bi bi-chat-dots me-2"></i>
                <div>
                  <h5 className="mb-0">Chat Customer Service</h5>
                  {/* <<-- Revisi: Hapus indikator online/offline karena pakai Supabase */}
                </div>
              </div>
            </div>
            
            <div className="card-body p-0">
              <div className="chat-messages" style={{ height: '400px', overflowY: 'auto', padding: '1rem' }}>
                {loading ? (
                  <div className="text-center text-muted py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  messages.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-chat display-4"></i>
                      <p className="mt-2">Belum ada pesan. Mulai percakapan dengan Customer Service!</p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={message.id || index} className={`d-flex mb-3 ${message.sender_id === user.id ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div 
                          className={`message-bubble p-2 rounded position-relative ${message.sender_id === user.id ? 'bg-primary text-white' : 'bg-light'}`} 
                          style={{ maxWidth: '70%', cursor: message.sender_id === user.id ? 'pointer' : 'default' }}
                          onContextMenu={(e) => message.sender_id === user.id && handleMessageClick(e, message)}
                          onClick={(e) => message.sender_id === user.id && handleMessageClick(e, message)}
                        >
                          {editingMessage === message.id ? ( // <<-- Revisi: Pakai id
                            <div>
                              <input
                                type="text"
                                className="form-control form-control-sm mb-2"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                autoFocus
                              />
                              <div className="d-flex gap-1">
                                <button className="btn btn-success btn-sm" onClick={handleSaveEdit}>
                                  <i className="bi bi-check"></i>
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingMessage(null)}>
                                  <i className="bi bi-x"></i>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="message-text">
                                {message.message}
                                {message.is_edited && <small className="ms-2 opacity-75">(diedit)</small>}
                              </div>
                              <small className={`d-block mt-1 ${message.sender_id === user.id ? 'text-white-50' : 'text-muted'}`}>
                                {new Date(message.created_at || message.timestamp).toLocaleTimeString('id-ID', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </small>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="card-footer">
              <form onSubmit={sendMessage}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ketik pesan Anda..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary" 
                    type="submit"
                    disabled={!newMessage.trim()}
                  >
                    <i className="bi bi-send"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="card">
              <div className="card-body">
                <h6 className="card-title">
                  <i className="bi bi-info-circle text-primary"></i> Informasi Chat
                </h6>
                <ul className="list-unstyled mb-0 small text-muted">
                  <li><i className="bi bi-clock"></i> Jam operasional: 08:00 - 17:00 WIB</li>
                  <li><i className="bi bi-telephone"></i> Telepon: (021) 123-4567</li>
                  <li><i className="bi bi-envelope"></i> Email: admin@darulabror.com</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className="position-fixed bg-white border rounded shadow-sm py-1"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y, 
            zIndex: 1050,
            minWidth: '120px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="btn btn-sm btn-link text-start w-100 text-decoration-none text-dark"
            onClick={handleEditMessage}
          >
            <i className="bi bi-pencil me-2"></i>Edit
          </button>
          <button 
            className="btn btn-sm btn-link text-start w-100 text-decoration-none text-danger"
            onClick={handleDeleteMessage}
          >
            <i className="bi bi-trash me-2"></i>Hapus
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;