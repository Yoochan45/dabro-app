import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../clientSupabase'; // Mengimpor client dari file Anda

// Custom Modal/Message Box component to replace alert() and confirm()
const CustomMessageBox = ({ message, type, onConfirm, onCancel, onClose }) => {
  if (!message) return null;

  const getButtonClass = (btnType) => {
    switch(btnType) {
      case 'confirm':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-xl font-bold">
            {type === 'confirm' ? 'Konfirmasi' : 'Pemberitahuan'}
          </h5>
          <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-center mb-6">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              className="px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
              onClick={onCancel}
            >
              Batal
            </button>
          )}
          {onConfirm && (
            <button
              type="button"
              className={`px-4 py-2 text-white rounded-lg transition-colors ${getButtonClass(type)}`}
              onClick={onConfirm}
            >
              OK
            </button>
          )}
          {!onConfirm && !onCancel && (
            <button
              type="button"
              className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={onClose}
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const { isAdmin } = useAuth();
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [usersData, setUsersData] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChildren, setUserChildren] = useState([]);
  const [messageBox, setMessageBox] = useState({ message: '', type: '', onConfirm: null, onCancel: null });
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    no_hp: '',
    role: 'wali',
    alamat: '',
    santriIds: [],
    permissions: {
      pembayaran: false,
      berita: false,
      keaktifan: false,
      santri: false,
      users: false
    }
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadUsers();
    loadSantri();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          nama,
          email,
          no_hp,
          role,
          alamat:wali_santri!wali_id(alamat),
          permissions,
          created_at,
          wali_santri_relasi!wali_id(santri_id)
        `);
      
      if (error) throw error;
      
      const transformedData = data.map(user => ({
        ...user,
        alamat: user.alamat?.[0]?.alamat || null,
        santri_ids: user.wali_santri_relasi?.map(rel => rel.santri_id) || [],
      }));

      setUsersData(transformedData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSantri = async () => {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select('santri_id, nama_santri, nis');
      
      if (error) throw error;
      setSantriList(data);
    } catch (error) {
      console.error('Error loading santri:', error);
    }
  };

  const loadUserChildren = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('wali_santri_relasi')
        .select(`
          santri_id,
          santri(nama_santri, tgl_lahir, kelas, kamar, status)
        `)
        .eq('wali_id', userId);
        
      if (error) throw error;
      setUserChildren(data.map(rel => rel.santri));
    } catch (error) {
      console.error('Error loading user children:', error);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      nama: '',
      email: '',
      no_hp: '',
      role: 'wali',
      alamat: '',
      santriIds: [],
      permissions: {
        pembayaran: false,
        berita: false,
        keaktifan: false,
        santri: false,
        users: false
      }
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama,
      email: user.email,
      no_hp: user.no_hp,
      role: user.role,
      alamat: user.alamat || '',
      santriIds: user.santri_ids || [],
      permissions: user.permissions || {
        pembayaran: false,
        berita: false,
        keaktifan: false,
        santri: false,
        users: false
      }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let error = null;
    let success = false;

    const userPayload = {
      nama: formData.nama,
      email: formData.email,
      no_hp: formData.no_hp,
      role: formData.role,
      permissions: formData.role === 'admin' ? formData.permissions : null,
    };

    if (editingUser) {
      const { error: userError } = await supabase
        .from('users')
        .update(userPayload)
        .eq('user_id', editingUser.user_id);
      
      if (userError) error = userError;
      else success = true;

    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([userPayload])
        .select();

      if (userError) error = userError;
      else {
        success = true;
        const newUserId = newUser[0].user_id;

        if (formData.role === 'wali') {
          const { error: waliError } = await supabase
            .from('wali_santri')
            .insert([{ wali_id: newUserId, alamat: formData.alamat || '' }]);
          if (waliError) error = waliError;

          if (formData.santriIds.length > 0 && !error) {
            const relations = formData.santriIds.map(santri_id => ({
              wali_id: newUserId,
              santri_id
            }));
            const { error: relasiError } = await supabase
              .from('wali_santri_relasi')
              .insert(relations);
            if (relasiError) error = relasiError;
          }
        }
      }
    }

    if (success) {
      setShowModal(false);
      await loadUsers();
      setMessageBox({ message: editingUser ? 'User berhasil diupdate!' : 'User berhasil ditambahkan!', type: 'info', onConfirm: () => setMessageBox({ message: '', type: '' }) });
    } else {
      setMessageBox({ message: error.message || 'Gagal menyimpan user', type: 'info', onConfirm: () => setMessageBox({ message: '', type: '' }) });
    }
    setLoading(false);
  };

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    if (user.role === 'wali') {
      await loadUserChildren(user.user_id);
    }
    setShowDetailModal(true);
  };

  const handleDelete = (id) => {
    setMessageBox({
      message: 'Yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.',
      type: 'confirm',
      onConfirm: async () => {
        setMessageBox({ message: '', type: '' });
        try {
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', id);

          if (error) throw error;

          await loadUsers();
          setMessageBox({ message: 'User berhasil dihapus!', type: 'info', onConfirm: () => setMessageBox({ message: '', type: '' }) });
        } catch (error) {
          setMessageBox({ message: error.message || 'Terjadi kesalahan', type: 'info', onConfirm: () => setMessageBox({ message: '', type: '' }) });
        }
      },
      onCancel: () => setMessageBox({ message: '', type: '' })
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('user_id', userId);
        
      if (error) throw error;
      await loadUsers();
      setMessageBox({ message: 'Role berhasil diubah!', type: 'info', onConfirm: () => setMessageBox({ message: '', type: '' }) });
    } catch (error) {
      setMessageBox({ message: error.message || 'Gagal mengubah role', type: 'info', onConfirm: () => setMessageBox({ message: '', type: '' }) });
    }
  };

  const handleSantriSelection = (e) => {
    const selectedOptions = Array.from(e.target.options)
      .filter(option => option.selected)
      .map(option => option.value);
    setFormData({ ...formData, santriIds: selectedOptions });
  };
  
  const handleSuperAdminChange = (e) => {
    const isChecked = e.target.checked;
    setFormData({
      ...formData,
      permissions: {
        pembayaran: isChecked,
        berita: isChecked,
        keaktifan: isChecked,
        santri: isChecked,
        users: isChecked
      }
    });
  };
  
  const getInitials = (nama) => {
    return nama.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'wali': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const getPermissionText = (permissions) => {
    if (!permissions) return 'Akses Standar';
    const activePermissions = Object.keys(permissions).filter(key => permissions[key]);
    if (activePermissions.length === 0) return 'Akses Standar';
    if (activePermissions.length === 5) return 'Akses Penuh';
    return `Akses: ${activePermissions.join(', ')}`;
  };

  const filteredUsers = usersData.filter(user => {
    const roleMatch = selectedRole === 'all' || user.role === selectedRole;
    const searchMatch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.no_hp.includes(searchTerm);
    return roleMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Daftar Anggota</h2>
        <div className="d-flex gap-2">
          <div className="input-group" style={{ width: '200px' }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari anggota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin() && (
            <button className="btn btn-primary" onClick={handleCreate}>
              <i className="bi bi-plus"></i> Tambah
            </button>
          )}
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <select 
            className="form-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">Semua Role</option>
            <option value="wali">Wali Santri</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="col-md-4">
          <select className="form-select">
            <option>Status Aktif</option>
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Non-Aktif</option>
          </select>
        </div>
        <div className="col-md-4">
          <select className="form-select">
            <option>Urutkan Nama A-Z</option>
            <option>Nama A-Z</option>
            <option>Nama Z-A</option>
            <option>Terbaru</option>
            <option>Terlama</option>
          </select>
        </div>
      </div>

      <div className="row g-4">
        {currentUsers.map((user) => (
          <div key={user.user_id} className="col-lg-3 col-md-4 col-sm-6">
            <div className="card user-card h-100">
              <div className="card-body text-center">
                <div className="user-avatar mb-3">
                  {user.foto ? (
                    <img 
                      src={`http://localhost:3002/uploads/${user.foto}`} 
                      alt={user.nama}
                      className="rounded-circle"
                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '80px', height: '80px' }}>
                      <span className="fw-bold fs-4 text-muted">{getInitials(user.nama)}</span>
                    </div>
                  )}
                </div>
                <h6 className="card-title fw-bold">{user.nama}</h6>
                <p className="text-muted small mb-1">{user.email}</p>
                <p className="text-muted small mb-2">{user.no_hp}</p>
                <div className="mb-2">
                  <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                    <i className={`bi ${user.role === 'admin' ? 'bi-shield-check' : 'bi-person'} me-1`}></i>
                    {user.role === 'admin' ? 'Admin' : 'Wali Santri'}
                  </span>
                </div>
                {user.role === 'admin' && (
                  <div className="small text-muted mb-3">
                    {getPermissionText(user.permissions)}
                  </div>
                )}
                {user.role === 'wali' && (
                  <div className="small text-muted mb-3">
                    <div><i className="bi bi-geo-alt me-1"></i>{user.alamat || 'Alamat tidak tersedia'}</div>
                    <div><i className="bi bi-people me-1"></i>{user.children_count || 0} Anak</div>
                  </div>
                )}
                <button 
                  className="btn btn-primary btn-sm w-100"
                  onClick={() => handleViewDetail(user)}
                >
                  <i className="bi bi-eye"></i> Detail
                </button>
                {isAdmin() && (
                  <div className="mt-2">
                    <div className="btn-group w-100" role="group">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => handleEdit(user)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <div className="btn-group" role="group">
                        <button 
                          className="btn btn-outline-info btn-sm dropdown-toggle" 
                          type="button" 
                          data-bs-toggle="dropdown"
                        >
                          Role
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleRoleChange(user.user_id, 'wali')}
                              disabled={user.role === 'wali'}
                            >
                              <i className="bi bi-person me-2"></i>Wali Santri
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleRoleChange(user.user_id, 'admin')}
                              disabled={user.role === 'admin'}
                            >
                              <i className="bi bi-shield-check me-2"></i>Admin
                            </button>
                          </li>
                        </ul>
                      </div>
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(user.user_id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}

      <div className="row mt-5">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-people display-4 text-primary"></i>
              <h3 className="text-primary mt-2">{filteredUsers.length}</h3>
              <p className="text-muted">Total Anggota</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-person-hearts display-4 text-success"></i>
              <h3 className="text-success mt-2">{filteredUsers.filter(u => u.role === 'wali').length}</h3>
              <p className="text-muted">Wali Santri</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-shield-check display-4 text-danger"></i>
              <h3 className="text-danger mt-2">{filteredUsers.filter(u => u.role === 'admin').length}</h3>
              <p className="text-muted">Admin</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-clock display-4 text-warning"></i>
              <h3 className="text-warning mt-2">0</h3>
              <p className="text-muted">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Edit Anggota' : 'Tambah Anggota'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama Lengkap</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">No. HP</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={formData.no_hp}
                        onChange={(e) => setFormData({...formData, no_hp: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Role</label>
                      <select
                        className="form-control"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        required
                      >
                        <option value="wali">Wali Santri</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {formData.role === 'wali' && (
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Alamat</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={formData.alamat}
                          onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                        ></textarea>
                      </div>
                    )}
                  </div>
                  {formData.role === 'wali' && (
                    <div className="mb-3">
                      <label className="form-label">Pilih Santri (Anak)</label>
                      <select
                        className="form-control"
                        multiple
                        value={formData.santriIds}
                        onChange={handleSantriSelection}
                      >
                        {santriList.map((santri) => (
                          <option key={santri.santri_id} value={santri.santri_id}>
                            {santri.nama_santri} ({santri.nis})
                          </option>
                        ))}
                      </select>
                      <div className="form-text">Pilih satu atau lebih santri yang menjadi anak dari wali ini.</div>
                    </div>
                  )}
                  {formData.role === 'admin' && (
                    <div className="mb-3">
                      <label className="form-label">Permissions</label>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="super-admin"
                          checked={Object.values(formData.permissions).every(p => p)}
                          onChange={handleSuperAdminChange}
                        />
                        <label className="form-check-label" htmlFor="super-admin">
                          Super Admin (Semua Akses)
                        </label>
                      </div>
                      <div className="row">
                        {Object.keys(formData.permissions).map((permission) => (
                          <div key={permission} className="col-md-6 mb-2">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={permission}
                                checked={formData.permissions[permission]}
                                onChange={(e) => setFormData({
                                  ...formData, 
                                  permissions: {
                                    ...formData.permissions,
                                    [permission]: e.target.checked
                                  }
                                })}
                              />
                              <label className="form-check-label" htmlFor={permission}>
                                {permission.charAt(0).toUpperCase() + permission.slice(1)}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedUser && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>
                  Detail Anggota
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    <div className="user-avatar mb-3">
                      {selectedUser.foto ? (
                        <img 
                          src={`http://localhost:3002/uploads/${selectedUser.foto}`} 
                          alt={selectedUser.nama}
                          className="rounded-circle"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '120px', height: '120px' }}>
                          <span className="fw-bold fs-2 text-muted">{getInitials(selectedUser.nama)}</span>
                        </div>
                      )}
                    </div>
                    <span className={`badge ${getRoleBadgeClass(selectedUser.role)} fs-6`}>
                      <i className={`bi ${selectedUser.role === 'admin' ? 'bi-shield-check' : 'bi-person'} me-1`}></i>
                      {selectedUser.role === 'admin' ? 'Admin' : 'Wali Santri'}
                    </span>
                  </div>
                  <div className="col-md-8">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Nama Lengkap:</strong></td>
                          <td>{selectedUser.nama}</td>
                        </tr>
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{selectedUser.email}</td>
                        </tr>
                        <tr>
                          <td><strong>No. HP:</strong></td>
                          <td>{selectedUser.no_hp}</td>
                        </tr>
                        <tr>
                          <td><strong>Role:</strong></td>
                          <td>{selectedUser.role === 'admin' ? 'Admin' : 'Wali Santri'}</td>
                        </tr>
                        {selectedUser.alamat && (
                          <tr>
                            <td><strong>Alamat:</strong></td>
                            <td>{selectedUser.alamat}</td>
                          </tr>
                        )}
                        <tr>
                          <td><strong>Terdaftar:</strong></td>
                          <td>{new Date(selectedUser.created_at).toLocaleDateString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {selectedUser.role === 'wali' && (
                  <div className="mt-4">
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-people me-2"></i>
                      Data Anak ({userChildren.length})
                    </h6>
                    {userChildren.length > 0 ? (
                      <div className="row">
                        {userChildren.map((child) => (
                          <div key={child.santri_id} className="col-md-6 mb-3">
                            <div className="card">
                              <div className="card-body">
                                <h6 className="card-title">{child.nama_santri}</h6>
                                <p className="card-text small">
                                  <i className="bi bi-mortarboard me-1"></i>Kelas: {child.kelas}<br/>
                                  <i className="bi bi-house me-1"></i>Kamar: {child.kamar}<br/>
                                  <i className="bi bi-calendar me-1"></i>
                                  Umur: {Math.floor((new Date() - new Date(child.tgl_lahir)) / (365.25 * 24 * 60 * 60 * 1000))} tahun
                                </p>
                                <span className={`badge ${child.status === 'aktif' ? 'bg-success' : 'bg-secondary'}`}>
                                  {child.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Belum ada data anak yang terdaftar untuk wali ini.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </button>
                {isAdmin() && (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedUser);
                    }}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CustomMessageBox 
        message={messageBox.message}
        type={messageBox.type}
        onConfirm={messageBox.onConfirm}
        onCancel={messageBox.onCancel}
        onClose={() => setMessageBox({ message: '', type: '', onConfirm: null, onCancel: null })}
      />
    </div>
  );
};

export default Users;
