import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import './NotificationHub.css';

export default function NotificationHub() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOverflow, setShowOverflow] = useState(false);

  const tabsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/Notification/GetAll`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Check if tabs container overflows and can be scrolled right
  const checkOverflow = () => {
    if (tabsRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
      // If there are elements hidden to the right, show the overflow indicator
      setShowOverflow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkOverflow();
    // Delay check slightly for DOM rendering
    const timer = setTimeout(checkOverflow, 300);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [notifications]);

  // Grab-to-scroll Mouse handlers
  const onMouseDown = (e) => {
    if (!tabsRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tabsRef.current.offsetLeft);
    setScrollLeft(tabsRef.current.scrollLeft);
    tabsRef.current.style.cursor = 'grabbing';
  };

  const onMouseLeave = () => {
    setIsDragging(false);
    if (tabsRef.current) {
      tabsRef.current.style.cursor = 'grab';
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    if (tabsRef.current) {
      tabsRef.current.style.cursor = 'grab';
    }
  };

  const onMouseMove = (e) => {
    if (!isDragging || !tabsRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // scroll speed multiplier
    tabsRef.current.scrollLeft = scrollLeft - walk;
    checkOverflow();
  };

  const onScroll = () => {
    checkOverflow();
  };

  // Helper categories (either parsed from Notification.Type or standard workflow ones)
  const categories = [
    { id: 'All', label: 'Tất cả thông báo' },
    { id: 'Unread', label: 'Chưa đọc (Unread)' },
    { id: 'System', label: 'Hệ thống (System)' },
    { id: 'Workflow', label: 'Quy trình luồng (Workflow)' },
    { id: 'Alert', label: 'Cảnh báo bảo mật (Alerts)' },
    { id: 'Email', label: 'Hàng đợi thư (Email Queue)' },
    { id: 'Sla', label: 'Chỉ số khẩn cấp (SLA)' },
    { id: 'User', label: 'Tài khoản người dùng' },
  ];

  // Filtered list
  const filteredNotifications = notifications.filter(item => {
    // 1) Category Filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Unread') {
        if (item.isRead || item.IsRead) return false;
      } else {
        const typeStr = String(item.type || item.Type || '').toLowerCase();
        const titleMsg = String((item.title || '') + ' ' + (item.message || '')).toLowerCase();
        
        let matchesCategory = false;
        if (selectedCategory === 'System') matchesCategory = typeStr.includes('system') || titleMsg.includes('system') || titleMsg.includes('hệ thống');
        else if (selectedCategory === 'Workflow') matchesCategory = typeStr.includes('workflow') || titleMsg.includes('flow') || titleMsg.includes('quy trình');
        else if (selectedCategory === 'Alert') matchesCategory = typeStr.includes('alert') || titleMsg.includes('cảnh báo') || titleMsg.includes('bất thường');
        else if (selectedCategory === 'Email') matchesCategory = typeStr.includes('mail') || titleMsg.includes('email') || titleMsg.includes('thư');
        else if (selectedCategory === 'Sla') matchesCategory = typeStr.includes('sla') || titleMsg.includes('trễ') || titleMsg.includes('hạn');
        else if (selectedCategory === 'User') matchesCategory = typeStr.includes('user') || titleMsg.includes('người dùng') || titleMsg.includes('tài khoản');
        
        if (!matchesCategory) return false;
      }
    }

    // 2) Search Term Filter
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const titleMatch = (item.title || item.Title || '').toLowerCase().includes(query);
      const msgMatch = (item.message || item.Message || '').toLowerCase().includes(query);
      const typeMatch = (item.type || item.Type || '').toLowerCase().includes(query);
      if (!titleMatch && !msgMatch && !typeMatch) {
        return false;
      }
    }

    return true;
  });

  // Toggle read status
  const toggleRead = async (item) => {
    try {
      const updated = {
        ...item,
        isRead: !item.isRead,
        IsRead: !item.IsRead
      };
      const formData = new FormData();
      formData.append('key', item.id || item.Id);
      formData.append('values', JSON.stringify(updated));

      const res = await fetch(`${API_BASE_URL}/api/Notification/UpdateData`, {
        method: 'PUT',
        body: formData
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => (n.id === item.id || n.Id === item.Id) ? updated : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá thông báo này?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/Notification/DeleteData?key=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => (n.id !== id && n.Id !== id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="nh-container">
      <div className="nh-card">
        <div className="nh-header">
          <h2>Trung tâm thông báo</h2>
          <button className="nh-refresh-btn" onClick={loadNotifications}>
            <i className="fa-solid fa-arrows-rotate"></i> Làm mới
          </button>
        </div>

        {/* Search Bar */}
        <div className="nh-search-bar">
          <div className="nh-search-wrap">
            <i className="fa-solid fa-magnifying-glass search-icon" />
            <input
              type="text"
              className="nh-search-input"
              placeholder="Tìm kiếm thông báo theo tiêu đề, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                className="nh-clear-search"
                onClick={() => setSearchTerm("")}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
          <div className="nh-results-counter">
            Tìm thấy <strong>{filteredNotifications.length}</strong> / <strong>{notifications.length}</strong> thông báo
          </div>
        </div>

        {/* Categories Bar with Horizontal Scroll + Drag */}
        <div className="nh-tabs-wrapper">
          <div 
            className="nh-tabs"
            ref={tabsRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onScroll={onScroll}
            style={{ cursor: 'grab' }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`nh-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {showOverflow && (
            <div className="nh-tabs-fade-ellipsis">
              <span className="nh-ellipsis-symbol">...</span>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="nh-list-container">
          {loading ? (
            <div className="nh-loading">Đang tải thông báo...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="nh-empty-state">
              <i className="fa-regular fa-bell-slash"></i>
              <p>Không có thông báo nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="nh-feed">
              {filteredNotifications.map((item) => {
                const isRead = item.isRead || item.IsRead;
                return (
                  <div key={item.id || item.Id} className={`nh-item-card ${isRead ? 'read' : 'unread'}`}>
                    <div className="nh-item-icon">
                      <i className={
                        String(item.type || item.Type).includes('system') ? 'fa-solid fa-server text-amber-500' :
                        String(item.type || item.Type).includes('alert') ? 'fa-solid fa-triangle-exclamation text-rose-500' :
                        'fa-solid fa-circle-info text-blue-500'
                      }></i>
                    </div>
                    <div className="nh-item-body">
                      <div className="nh-item-meta">
                        <span className="nh-item-time">
                          {item.createdDate || item.CreatedDate 
                            ? new Date(item.createdDate || item.CreatedDate).toLocaleString('vi-VN') 
                            : 'Mới đây'}
                        </span>
                        {!isRead && <span className="nh-unread-badge">Mới</span>}
                      </div>
                      <h4 className="nh-item-title">{item.title || item.Title}</h4>
                      <p className="nh-item-msg">{item.message || item.Message}</p>
                      {item.url || item.Url ? (
                        <a href={item.url || item.Url} target="_blank" rel="noreferrer" className="nh-item-link">
                          Xem chi tiết <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      ) : null}
                    </div>
                    <div className="nh-item-actions">
                      <button 
                        className={`nh-action-btn ${isRead ? 'mark-unread' : 'mark-read'}`} 
                        title={isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                        onClick={() => toggleRead(item)}
                      >
                        <i className={isRead ? "fa-regular fa-envelope" : "fa-regular fa-envelope-open"}></i>
                      </button>
                      <button 
                        className="nh-action-btn delete" 
                        title="Xoá thông báo"
                        onClick={() => deleteNotification(item.id || item.Id)}
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
