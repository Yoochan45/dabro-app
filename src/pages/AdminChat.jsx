import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor supabase client

const AdminChat = () => {
  const { user } = useAuth();
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');

  // <<-- Revisi: Ganti Socket.io dengan Supabase Realtime
  useEffect(() => {
    // Ambil daftar chat aktif saat komponen pertama kali dimuat
    loadActiveChats();

    // Hanya jalankan realtime jika user dan chat sudah dipilih
    if (user && selectedChat) {
      // Supabase Realtime untuk mendengarkan pesan baru
      const chatChannel = supabase
        .channel(`public:messages`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          (payload) => {
            const newMessage = payload.new;
            if (newMessage.sender_id === selectedChat.id) {
              setMessages(prev => [...prev, { ...newMessage, isOwn: false }]);
              loadActiveChats(); // Muat ulang daftar chat untuk update status
            }
          }
        )
        .subscribe();
    
      return () => {
        supabase.removeChannel(chatChannel);
      };
    }
  }, [user, selectedChat]); // Perbarui dependency

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadActiveChats = async () => {
    setLoading(true);
    try {
      // <<-- Revisi: Ganti fetch dengan Supabase client
      // Mengambil daftar user yang pernah chat dengan admin
      const { data, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          receiver_id,
          message,
          created_at,
          profiles:sender_id(nama)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      const chatsMap = new Map();
      data.forEach(msg => {
        const userId = msg.sender_id;
        if (!chatsMap.has(userId)) {
          chatsMap.set(userId, {
            id: userId,
            nama: msg.profiles.nama,
            last_message: msg.message,
            unread_count: 0 // <<-- Untuk hitung ini, butuh query tambahan
          });
        }
      });
      setActiveChats(Array.from(chatsMap.values()));

    } catch (error) {
      console.error('Error loading active chats:', error.message);
    }
    setLoading(false);
  };

  const loadMessages = async (userId) => {
    setLoading(true);
    try {
      // <<-- Revisi: Ganti fetch dengan Supabase client
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(data.map(msg => ({
        ...msg,
        isOwn: msg.sender_id === user.id
      })));
    } catch (error) {
      console.error('Error loading messages:', error.message);
    }
    setLoading(false);
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  const handleMessageClick = (e, message) => {
    e.preventDefault();
    if (message.sender_id !== user.id) return;
    
    setSelectedMessage(message);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleEditMessage = () => {
    setEditingMessage(selectedMessage.id); // <<-- Revisi: pakai id Supabase
    setEditText(selectedMessage.message);
    setShowContextMenu(false);
  };

  const handleDeleteMessage = async () => {
    try {
      // <<-- Revisi: Ganti fetch dengan Supabase client
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', selectedMessage.id); // <<-- Revisi: pakai id Supabase

      if (error) {
        throw error;
      }

      await loadMessages(selectedChat.id);
    } catch (error) {
      console.error('Error deleting message:', error.message);
    }
    setShowContextMenu(false);
  };

  const handleSaveEdit = async () => {
    try {
      // <<-- Revisi: Ganti fetch dengan Supabase client
      const { error } = await supabase
        .from('messages')
        .update({ message: editText, is_edited: true })
        .eq('id', editingMessage);

      if (error) {
        throw error;
      }

      await loadMessages(selectedChat.id);
    } catch (error) {
      console.error('Error editing message:', error.message);
    }
    setEditingMessage(null);
  };

  const sendMessage = async (e) => { // <<-- Revisi: Tambah async
    e.preventDefault();
    
    if (newMessage.trim() && selectedChat) {
      const messageData = {
        sender_id: user.id, // <<-- Revisi: Pakai id user dari auth
        receiver_id: selectedChat.id,
        message: newMessage.trim()
      };

      // <<-- Revisi: Ganti socket.emit dengan Supabase client
      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Error sending message:', error.message);
      } else {
        setNewMessage('');
        // Data akan di-update secara real-time lewat useEffect
      }
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Daftar Chat Wali
              </h5>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-4">Loading...</div>
              ) : (
                activeChats.length === 0 ? (
                  <div className="text-center p-4 text-muted">
                    <i className="bi bi-chat display-4"></i>
                    <p className="mt-2">Belum ada chat aktif</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {activeChats.map((chat) => (
                      <button
                        key={chat.id}
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${selectedChat?.id === chat.id ? 'active' : ''}`}
                        onClick={() => selectChat(chat)}
                      >
                        <div className="ms-2 me-auto">
                          <div className="fw-bold">{chat.nama}</div>
                          <small className="text-muted">{chat.last_message}</small>
                        </div>
                        {chat.unread_count > 0 && (
                          <span className="badge bg-danger rounded-pill">{chat.unread_count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {selectedChat ? (
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h6 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>
                  Chat dengan {selectedChat.nama}
                </h6>
              </div>
              
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center p-4">Loading messages...</div>
                ) : (
                  <div className="chat-messages" style={{ height: '400px', overflowY: 'auto', padding: '1rem' }}>
                    {messages.map((message, index) => (
                      <div key={message.id || index} className={`d-flex mb-3 ${message.sender_id === user.id ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div 
                          className={`message-bubble p-2 rounded position-relative ${message.sender_id === user.id ? 'bg-primary text-white' : 'bg-light'}`} 
                          style={{ maxWidth: '70%', cursor: message.sender_id === user.id ? 'pointer' : 'default' }}
                          onContextMenu={(e) => message.sender_id === user.id && handleMessageClick(e, message)}
                          onClick={(e) => message.sender_id === user.id && handleMessageClick(e, message)}
                        >
                          {editingMessage === message.id ? ( // <<-- Revisi
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
                                {new Date(message.timestamp || message.created_at).toLocaleTimeString('id-ID', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </small>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="card-footer">
                <form onSubmit={sendMessage}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ketik balasan..."
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
          ) : (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-chat-square-dots display-4 text-muted"></i>
                <h5 className="mt-3 text-muted">Pilih chat untuk memulai percakapan</h5>
              </div>
            </div>
          )}
        </div>
      </div>

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

export default AdminChat;