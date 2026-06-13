import { useEffect, useState, useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';
// --- ĐÃ THÊM 2 API MỚI VÀO DÒNG NÀY ---
import { getProfileApi, updateNameApi, getPendingUsersApi, handleApprovalApi } from '../services/auth.service';
import { AuthContext } from '../context/AuthContext';

import {
  Bell, MoreVertical, User, MapPin, Settings as SettingsIcon,
  X, Calendar, Shield, Trash2, AlertTriangle,
  Wifi, WifiOff, Clock,
  Sun, Cloud, CloudRain, CloudSun, CloudLightning,
  UserPlus, Check // --- ĐÃ THÊM ICON MỚI VÀO ĐÂY ---
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

// =============================================
// INJECT HEADER STYLES
// =============================================
const headerStyles = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.ch-header {
  height: 56px;
  background: #050c18;
  border-bottom: 1px solid #1a3a5c;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 40;
  margin-left: 256px;
  font-family: 'IBM Plex Sans', sans-serif;
  box-shadow: 0 1px 0 rgba(0,170,255,0.08), 0 4px 20px rgba(0,0,0,0.4);
}

.ch-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #c8dff5;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.ch-location svg { color: #00aaff; }

/* WIDGETS ROW */
.ch-widgets {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Generic widget pill */
.ch-widget {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: #0a1628;
  border: 1px solid #1a3a5c;
  border-radius: 10px;
  transition: border-color 0.2s;
}
.ch-widget:hover { border-color: #1e5f99; }

.ch-widget-icon {
  width: 28px; height: 28px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,170,255,0.1);
  border: 1px solid rgba(0,170,255,0.15);
  flex-shrink: 0;
}

/* Clock widget */
.ch-clock-time {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1;
  letter-spacing: 0.03em;
}
.ch-clock-date {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  font-weight: 400;
  color: #4a6a8a;
  margin-top: 3px;
  letter-spacing: 0.05em;
}

/* Weather widget */
.ch-weather-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  color: #4a6a8a;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  line-height: 1;
}
.ch-weather-val {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 3px;
}
.ch-weather-temp {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}
.ch-weather-desc {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: #6a8aa0;
}

/* Server status widget */
.ch-server {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid;
  transition: all 0.2s;
}
.ch-server.online {
  background: rgba(0,229,160,0.06);
  border-color: rgba(0,229,160,0.2);
}
.ch-server.offline {
  background: rgba(255,60,90,0.06);
  border-color: rgba(255,60,90,0.2);
}
.ch-server-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  line-height: 1;
}
.ch-server.online .ch-server-label { color: rgba(0,229,160,0.6); }
.ch-server.offline .ch-server-label { color: rgba(255,60,90,0.6); }
.ch-server-status {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
  letter-spacing: 0.02em;
}
.ch-server.online .ch-server-status { color: #00e5a0; }
.ch-server.offline .ch-server-status { color: #ff3c5a; }
.ch-server-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #00e5a0;
  box-shadow: 0 0 6px #00e5a0;
  animation: chPulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes chPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 4px #00e5a0; }
  50% { opacity: 0.6; box-shadow: 0 0 10px #00e5a0; }
}

/* Divider */
.ch-divider {
  width: 1px;
  height: 28px;
  background: #1a3a5c;
  margin: 0 4px;
}

/* Bell button */
.ch-bell-btn {
  position: relative;
  width: 36px; height: 36px;
  border-radius: 9px;
  border: 1px solid #1a3a5c;
  background: #0a1628;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #4a6a8a;
  transition: all 0.2s;
}
.ch-bell-btn:hover, .ch-bell-btn.active {
  border-color: #1e5f99;
  background: rgba(0,170,255,0.1);
  color: #00aaff;
}
.ch-bell-badge {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 16px; height: 16px;
  background: #ff3c5a;
  border: 2px solid #050c18;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 8px;
  font-weight: 600;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  padding: 0 2px;
  animation: chBounce 1s ease-in-out infinite;
}
@keyframes chBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* Notification dropdown */
.ch-noti-dropdown {
  position: absolute;
  right: 0; top: calc(100% + 10px);
  width: 380px; /* --- ĐÃ MỞ RỘNG TỪ 340px -> 380px CHO ĐẸP MẮT TABS --- */
  background: #070f1f;
  border: 1px solid #1a3a5c;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,170,255,0.05);
  overflow: hidden;
  z-index: 20;
  animation: chDropIn 0.15s ease;
}
@keyframes chDropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* --- BỔ SUNG CSS CHO TABS VÀ NÚT DUYỆT TÀI KHOẢN --- */
.ch-noti-tabs { display: flex; border-bottom: 1px solid #1a3a5c; background: #0a1628; }
.ch-noti-tab { flex: 1; padding: 12px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4a6a8a; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 6px;}
.ch-noti-tab.active { color: #fff; background: rgba(0,170,255,0.05); border-bottom-color: #00aaff; }
.ch-noti-tab-badge { background: #ff3c5a; color: white; border-radius: 10px; padding: 1px 6px; font-size: 9px; font-weight: bold; }

.ch-approval-actions { display: flex; gap: 8px; margin-top: 10px; }
.ch-btn-approve { flex: 1; padding: 6px; background: rgba(0,229,160,0.15); border: 1px solid #00e5a0; color: #00e5a0; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s;}
.ch-btn-approve:hover { background: #00e5a0; color: #000; }
.ch-btn-reject { flex: 1; padding: 6px; background: rgba(255,60,90,0.15); border: 1px solid #ff3c5a; color: #ff3c5a; border-radius: 6px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.2s;}
.ch-btn-reject:hover { background: #ff3c5a; color: #fff; }
.ch-noti-icon.info { background: rgba(0,170,255,0.12); border-color: rgba(0,170,255,0.2); color: #00aaff; animation: none; }
/* --------------------------------------------------- */

.ch-noti-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #1a3a5c;
  background: rgba(255,60,90,0.04);
}
.ch-noti-title {
  display: flex; align-items: center; gap: 7px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #ff3c5a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.ch-noti-clear {
  background: none; border: none; cursor: pointer;
  color: #4a6a8a; padding: 4px; border-radius: 6px;
  transition: all 0.2s; display: flex; align-items: center;
}
.ch-noti-clear:hover { color: #ff3c5a; background: rgba(255,60,90,0.1); }
.ch-noti-list { max-height: 380px; overflow-y: auto; }
.ch-noti-empty {
  padding: 40px 20px;
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.ch-noti-empty-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  color: #00e5a0;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.ch-noti-item {
  display: flex; gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #0d1d35;
  background: rgba(255,60,90,0.03);
  transition: background 0.15s;
}
.ch-noti-item:hover { background: rgba(255,60,90,0.06); }
.ch-noti-icon {
  background: rgba(255,60,90,0.12);
  border: 1px solid rgba(255,60,90,0.2);
  border-radius: 8px;
  padding: 8px;
  color: #ff3c5a;
  height: fit-content;
  flex-shrink: 0;
  animation: chPulse 1.5s ease-in-out infinite;
}
.ch-noti-name {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #ff8090;
  line-height: 1.3;
}
.ch-noti-name span {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: #ff3c5a;
}
.ch-noti-detail {
  font-size: 10px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,60,90,0.1);
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 6px;
  display: flex; flex-direction: column; gap: 4px;
}
.ch-noti-detail-row {
  display: flex; justify-content: space-between;
  font-family: 'IBM Plex Mono', monospace;
}
.ch-noti-detail-key { color: #4a6a8a; font-size: 9px; }
.ch-noti-detail-val { color: #c8dff5; font-size: 9px; font-weight: 500; }
.ch-noti-time {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  color: #2a4a6a;
  text-align: right;
  margin-top: 5px;
}

/* User area */
.ch-user-area {
  display: flex; align-items: center; gap: 10px;
  padding-left: 12px;
  border-left: 1px solid #1a3a5c;
  position: relative;
}
.ch-user-info { text-align: right; }
.ch-user-name {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #c8dff5;
  line-height: 1;
}
.ch-user-role {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  color: #4a6a8a;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 3px;
}
.ch-avatar {
  width: 34px; height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #0055cc, #003388);
  border: 1px solid rgba(0,170,255,0.3);
  display: flex; align-items: center; justify-content: center;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 0 12px rgba(0,80,200,0.3);
  flex-shrink: 0;
}
.ch-more-btn {
  width: 30px; height: 30px;
  border-radius: 7px;
  border: 1px solid #1a3a5c;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #4a6a8a;
  transition: all 0.2s;
}
.ch-more-btn:hover, .ch-more-btn.active {
  border-color: #1e5f99;
  background: rgba(0,170,255,0.1);
  color: #00aaff;
}

/* Account dropdown */
.ch-account-dropdown {
  position: absolute;
  right: 0; top: calc(100% + 10px);
  width: 200px;
  background: #070f1f;
  border: 1px solid #1a3a5c;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  padding: 6px;
  z-index: 20;
  animation: chDropIn 0.15s ease;
}
.ch-account-btn {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #6a8aa0;
  text-align: left;
  transition: all 0.15s;
}
.ch-account-btn:hover {
  background: rgba(0,170,255,0.08);
  color: #00aaff;
}
.ch-account-btn svg { flex-shrink: 0; }

/* MODAL OVERLAY */
.ch-modal-overlay {
  position: fixed; inset: 0;
  z-index: 100;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.ch-modal-backdrop {
  position: absolute; inset: 0;
  background: rgba(2,6,15,0.85);
  backdrop-filter: blur(8px);
}
.ch-modal {
  position: relative;
  background: #070f1f;
  border: 1px solid #1e5f99;
  border-radius: 16px;
  width: 100%; max-width: 440px;
  box-shadow: 0 0 60px rgba(0,100,200,0.2);
  overflow: hidden;
  animation: chModalIn 0.2s ease;
}
@keyframes chModalIn {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.ch-modal-hero {
  background: linear-gradient(135deg, #0a1e3d, #0d2a50);
  border-bottom: 1px solid #1a3a5c;
  padding: 24px;
}
.ch-modal-hero-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 18px;
}
.ch-modal-hero-title {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}
.ch-modal-close {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 7px;
  padding: 5px;
  cursor: pointer;
  color: #6a8aa0;
  transition: all 0.2s;
  display: flex;
}
.ch-modal-close:hover { color: #ff3c5a; background: rgba(255,60,90,0.1); border-color: rgba(255,60,90,0.3); }
.ch-modal-avatar {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: rgba(0,170,255,0.15);
  border: 2px solid rgba(0,170,255,0.3);
  display: flex; align-items: center; justify-content: center;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #00aaff;
}
.ch-modal-username {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  margin-left: 14px;
}
.ch-modal-body {
  padding: 20px 24px;
  display: flex; flex-direction: column; gap: 16px;
}
.ch-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ch-modal-field {
  display: flex; flex-direction: column; gap: 6px;
}
.ch-modal-field-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  font-weight: 500;
  color: #4a6a8a;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  display: flex; align-items: center; gap: 4px;
}
.ch-modal-field-val {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #c8dff5;
  background: rgba(0,0,0,0.2);
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  padding: 8px 12px;
}
.ch-modal-building {
  background: rgba(0,100,255,0.08);
  border: 1px solid rgba(0,100,255,0.2);
  border-radius: 10px;
  padding: 14px;
}
.ch-modal-building-name {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #5599ff;
}
.ch-modal-building-addr {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 11px; color: #4a6a8a; margin-top: 4px;
}
.ch-modal-building-code {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 8px;
  background: rgba(0,100,255,0.15);
  border: 1px solid rgba(0,100,255,0.3);
  border-radius: 5px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; font-weight: 500;
  color: #5599ff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.ch-modal-superadmin {
  background: rgba(255,184,0,0.06);
  border: 1px solid rgba(255,184,0,0.2);
  border-radius: 10px;
  padding: 14px;
}
.ch-modal-superadmin-title {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #ffb800;
}
.ch-modal-superadmin-desc {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 11px; color: #7a6a30; margin-top: 4px; line-height: 1.5;
}
.ch-modal-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid #1a3a5c;
  background: rgba(0,0,0,0.15);
}
.ch-btn-secondary {
  padding: 9px 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  color: #6a8aa0;
  cursor: pointer; transition: all 0.2s;
}
.ch-btn-secondary:hover { color: #c8dff5; border-color: #1e5f99; }
.ch-btn-danger {
  padding: 9px 18px;
  background: rgba(255,60,90,0.12);
  border: 1px solid rgba(255,60,90,0.3);
  border-radius: 8px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  color: #ff3c5a;
  cursor: pointer; transition: all 0.2s;
}
.ch-btn-danger:hover { background: rgba(255,60,90,0.2); }

/* Settings modal */
.ch-settings-modal {
  position: relative;
  background: #070f1f;
  border: 1px solid #1e5f99;
  border-radius: 16px;
  width: 100%; max-width: 380px;
  box-shadow: 0 0 60px rgba(0,100,200,0.2);
  overflow: hidden;
  animation: chModalIn 0.2s ease;
}
.ch-settings-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #1a3a5c;
  background: rgba(0,170,255,0.03);
}
.ch-settings-title {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px; font-weight: 700;
  color: #c8dff5;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.ch-settings-form {
  padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}
.ch-settings-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; font-weight: 500;
  color: #4a6a8a;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 6px;
  display: block;
}
.ch-settings-input {
  width: 100%; padding: 11px 14px;
  background: rgba(0,0,0,0.3);
  border: 1px solid #1a3a5c;
  border-radius: 8px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px; font-weight: 500;
  color: #c8dff5;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}
.ch-settings-input:focus {
  border-color: #00aaff;
  background: rgba(0,170,255,0.05);
  box-shadow: 0 0 0 3px rgba(0,170,255,0.1);
}
.ch-btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(0,85,180,0.8), rgba(0,50,150,0.9));
  border: 1px solid #00aaff;
  border-radius: 8px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px; font-weight: 600;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 0 16px rgba(0,100,255,0.2);
  transition: all 0.2s;
}
.ch-btn-primary:hover { box-shadow: 0 0 24px rgba(0,120,255,0.35); }
.ch-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
`;

if (typeof document !== 'undefined' && !document.getElementById('cyber-header-styles')) {
  const el = document.createElement('style');
  el.id = 'cyber-header-styles';
  el.textContent = headerStyles;
  document.head.appendChild(el);
}

const Header = () => {
  const { user } = useContext(AuthContext);
  const { notifications, clearAll, socket } = useContext(NotificationContext);

  const [isOnline, setIsOnline] = useState(false);
  const [weather, setWeather] = useState({ temp: '--', label: 'Đang tải...', icon: <CloudSun size={14} style={{ color: '#ffb800' }} /> });
  const [now, setNow] = useState(new Date());

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNoti, setShowNoti] = useState(false);

  // --- BỔ SUNG: STATE CHO TABS CHUÔNG ---
  const [notiTab, setNotiTab] = useState('alarms');
  const [pendingUsers, setPendingUsers] = useState([]);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.fullName || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // --- BỔ SUNG: LOGIC LẤY DANH SÁCH DUYỆT TÀI KHOẢN KHI MỚI VÀO ---
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      getPendingUsersApi()
        .then(data => setPendingUsers(data))
        .catch(err => console.error("Lỗi lấy danh sách chờ duyệt", err));
    }
  }, [user?.role]);

  // --- BỔ SUNG: LẮNG NGHE SOCKET KHI CÓ NGƯỜI ĐĂNG KÝ MỚI ---
  useEffect(() => {
    if (!socket || user?.role !== 'SUPER_ADMIN') return;

    const handleNewReg = (newUser) => {
      setPendingUsers(prev => [newUser, ...prev]);
      toast.success(`Có yêu cầu tài khoản mới từ ${newUser.fullName}!`, { icon: '👤' });
      setNotiTab('approvals'); // Tự động bật sang tab Duyệt
    };

    socket.on("new-registration", handleNewReg);
    return () => socket.off("new-registration", handleNewReg);
  }, [socket, user?.role]);

  // --- BỔ SUNG: HÀM XỬ LÝ BẤM NÚT ĐỒNG Ý / TỪ CHỐI ---
  const handleApprovalSubmit = async (userId, action) => {
    try {
      await handleApprovalApi({ userId, action });
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(action === 'APPROVE' ? "Đã duyệt cấp quyền!" : "Đã từ chối yêu cầu!");
    } catch (error) {
      toast.error("Xử lý thất bại. Vui lòng thử lại!");
    }
  };

  const activeFaultsCount = notifications.length;
  // --- BỔ SUNG: TỔNG SỐ THÔNG BÁO CHO CHUÔNG ---
  const totalNotiCount = activeFaultsCount + pendingUsers.length;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleShowProfile = async () => {
    setShowDropdown(false);
    setLoadingProfile(true);
    try {
      const data = await getProfileApi();
      setProfileData(data);
      setIsProfileModalOpen(true);
    } catch (error) {
      console.error("Lỗi lấy profile:", error);
      toast.error("Không thể tải thông tin tài khoản!");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const result = await updateNameApi(newName);
      const updatedUser = { ...user, fullName: result.user.fullName };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
      toast.success("Cập nhật tên thành công!");
      setIsSettingsModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (!socket) return;
    setIsOnline(socket.connected);
    socket.on("connect", () => setIsOnline(true));
    socket.on("disconnect", () => setIsOnline(false));
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [socket]);

  const fetchWeather = async () => {
    try {
      const response = await axios.get(
        'https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current=temperature_2m,weather_code'
      );
      const { temperature_2m, weather_code } = response.data.current;
      const weatherMapping = (code) => {
        if (code === 0) return { label: 'Trời quang', icon: <Sun size={14} style={{ color: '#ffb800' }} /> };
        if (code <= 3) return { label: 'Ít mây', icon: <CloudSun size={14} style={{ color: '#ffaa00' }} /> };
        if (code <= 48) return { label: 'Có sương', icon: <Cloud size={14} style={{ color: '#6a8aa0' }} /> };
        if (code <= 67) return { label: 'Đang mưa', icon: <CloudRain size={14} style={{ color: '#55aaff' }} /> };
        if (code <= 99) return { label: 'Có dông', icon: <CloudLightning size={14} style={{ color: '#aa55ff' }} /> };
        return { label: 'U ám', icon: <Cloud size={14} style={{ color: '#4a6a8a' }} /> };
      };
      const result = weatherMapping(weather_code);
      setWeather({ temp: Math.round(temperature_2m), label: result.label, icon: result.icon });
    } catch (error) {
      console.error("Lỗi lấy thời tiết:", error);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="ch-header ml-72">
        {/* LEFT: Location */}
        <div className="ch-location">
          <MapPin size={13} />
          <span>{user?.building?.address || user?.building?.name || 'Toàn hệ thống quản trị'}</span>
        </div>

        {/* RIGHT: Widgets + User */}
        <div className="ch-widgets">

          {/* Clock */}
          <div className="ch-widget">
            <div className="ch-widget-icon">
              <Clock size={14} style={{ color: '#00aaff' }} />
            </div>
            <div>
              <div className="ch-clock-time">{timeStr}</div>
              <div className="ch-clock-date">{dateStr}</div>
            </div>
          </div>

          {/* Weather */}
          <div className="ch-widget">
            <div className="ch-widget-icon" style={{ background: 'rgba(255,184,0,0.08)', borderColor: 'rgba(255,184,0,0.15)' }}>
              {weather.icon}
            </div>
            <div>
              <div className="ch-weather-label">Outdoor Temp</div>
              <div className="ch-weather-val">
                <span className="ch-weather-temp">{weather.temp}°C</span>
                <span className="ch-weather-desc">• {weather.label}</span>
              </div>
            </div>
          </div>

          {/* Server status */}
          <div className={`ch-server ${isOnline ? 'online' : 'offline'}`}>
            {isOnline
              ? <Wifi size={14} style={{ color: '#00e5a0' }} />
              : <WifiOff size={14} style={{ color: '#ff3c5a' }} />
            }
            <div>
              <div className="ch-server-label">Server</div>
              <div className="ch-server-status">{isOnline ? 'Connected' : 'Disconnected'}</div>
            </div>
            {isOnline && <div className="ch-server-dot" />}
          </div>

          <div className="ch-divider" />

          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <button
              className={`ch-bell-btn ${showNoti ? 'active' : ''}`}
              onClick={() => setShowNoti(!showNoti)}
            >
              <Bell size={16} />
              {/* --- BỔ SUNG: THAY BẰNG TOTAL NOTI COUNT --- */}
              {totalNotiCount > 0 && (
                <span className="ch-bell-badge">{totalNotiCount}</span>
              )}
            </button>

            {showNoti && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowNoti(false)} />
                <div className="ch-noti-dropdown">

                  {/* --- BỔ SUNG: 2 NÚT TABS --- */}
                  <div className="ch-noti-tabs">
                    <button className={`ch-noti-tab ${notiTab === 'alarms' ? 'active' : ''}`} onClick={() => setNotiTab('alarms')}>
                      Cảnh báo {activeFaultsCount > 0 && <span className="ch-noti-tab-badge">{activeFaultsCount}</span>}
                    </button>

                    {/* Chỉ Super Admin mới thấy Tab Chờ duyệt */}
                    {user?.role === 'SUPER_ADMIN' && (
                      <button className={`ch-noti-tab ${notiTab === 'approvals' ? 'active' : ''}`} onClick={() => setNotiTab('approvals')}>
                        Chờ duyệt {pendingUsers.length > 0 && <span className="ch-noti-tab-badge" style={{ background: '#00aaff' }}>{pendingUsers.length}</span>}
                      </button>
                    )}
                  </div>

                  {/* TAB 1: CẢNH BÁO THIẾT BỊ (BỌC BỞI ĐIỀU KIỆN notiTab) */}
                  {notiTab === 'alarms' && (
                    <>
                      <div className="ch-noti-header">
                        <div className="ch-noti-title">
                          <AlertTriangle size={14} /> Cảnh báo hiện hành
                        </div>
                        {notifications.length > 0 && (
                          <button className="ch-noti-clear" onClick={clearAll} title="Ẩn tất cả">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="ch-noti-list">
                        {notifications.length === 0 ? (
                          <div className="ch-noti-empty">
                            <Shield size={36} style={{ color: '#00e5a0', opacity: 0.3 }} />
                            <span className="ch-noti-empty-label">Hệ thống an toàn</span>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.code} className="ch-noti-item">
                              <div className="ch-noti-icon">
                                <AlertTriangle size={16} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="ch-noti-name">
                                  {n.details?.name} <span>({n.code})</span> đang báo sự cố!
                                </div>
                                <div className="ch-noti-detail">
                                  <div className="ch-noti-detail-row">
                                    <span className="ch-noti-detail-key">Vị trí</span>
                                    <span className="ch-noti-detail-val">{n.details?.location || 'N/A'}</span>
                                  </div>
                                  {user?.role === 'SUPER_ADMIN' && (
                                    <>
                                      <div className="ch-noti-detail-row">
                                        <span className="ch-noti-detail-key">Cơ sở</span>
                                        <span className="ch-noti-detail-val" style={{ color: '#5599ff' }}>{n.details?.buildingName}</span>
                                      </div>
                                      <div className="ch-noti-detail-row">
                                        <span className="ch-noti-detail-key">Quản lý</span>
                                        <span className="ch-noti-detail-val" style={{ color: '#00e5a0' }}>{n.details?.managerName}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="ch-noti-time">Cập nhật: <strong>{n.time}</strong></div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}

                  {/* --- BỔ SUNG: TAB 2 - YÊU CẦU CẤP QUYỀN TÀI KHOẢN --- */}
                  {notiTab === 'approvals' && user?.role === 'SUPER_ADMIN' && (
                    <>
                      <div className="ch-noti-header">
                        <div className="ch-weather-label" style={{ color: '#00aaff', fontSize: '10px' }}><UserPlus size={12} style={{ display: 'inline', marginBottom: '-2px' }} /> Yêu cầu tham gia hệ thống</div>
                      </div>
                      <div className="ch-noti-list custom-scrollbar">
                        {pendingUsers.length === 0 ? (
                          <div className="ch-noti-empty"><Shield size={32} style={{ color: '#00aaff', opacity: 0.3 }} /><span className="ch-noti-empty-label" style={{ color: '#00aaff' }}>Không có yêu cầu nào</span></div>
                        ) : (
                          pendingUsers.map(u => (
                            <div key={u.id} className="ch-noti-item">
                              <div className="ch-noti-icon info"><UserPlus size={16} /></div>
                              <div style={{ flex: 1 }}>
                                <div className="ch-noti-name" style={{ color: '#fff' }}>
                                  {u.fullName} <span style={{ color: '#00aaff' }}>@{u.username}</span>
                                </div>
                                <div className="ch-noti-detail">
                                  <div className="ch-noti-detail-row"><span className="ch-noti-detail-key">Email</span><span className="ch-noti-detail-val" style={{ textTransform: 'none' }}>{u.email}</span></div>
                                  <div className="ch-noti-detail-row">
                                    <span className="ch-noti-detail-key">Cơ sở xin cấp quyền</span>
                                    <span className="ch-noti-detail-val" style={{ color: '#00e5a0' }}>
                                      {u.requestedBuilding ? `${u.requestedBuilding.name} (${u.requestedBuilding.code})` : 'N/A'}
                                    </span>
                                  </div>
                                </div>

                                <div className="ch-approval-actions">
                                  <button onClick={() => handleApprovalSubmit(u.id, 'APPROVE')} className="ch-btn-approve">
                                    <Check size={12} /> Phê duyệt
                                  </button>
                                  <button onClick={() => handleApprovalSubmit(u.id, 'REJECT')} className="ch-btn-reject">
                                    <X size={12} /> Từ chối
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}

                </div>
              </>
            )}
          </div>

          {/* User */}
          <div className="ch-user-area">
            <div className="ch-user-info">
              <div className="ch-user-name">{user?.fullName}</div>
              <div className="ch-user-role">{user?.role}</div>
            </div>
            <div className="ch-avatar">{user?.fullName?.charAt(0).toUpperCase()}</div>
            <button
              className={`ch-more-btn ${showDropdown ? 'active' : ''}`}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <MoreVertical size={15} />
            </button>

            {showDropdown && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowDropdown(false)} />
                <div className="ch-account-dropdown">
                  <button className="ch-account-btn" onClick={handleShowProfile} disabled={loadingProfile}>
                    <User size={14} />
                    {loadingProfile ? 'Đang tải...' : 'Thông tin tài khoản'}
                  </button>
                  <button className="ch-account-btn" onClick={() => { setIsSettingsModalOpen(true); setNewName(user?.fullName || ""); setShowDropdown(false); }}>
                    <SettingsIcon size={14} /> Cài đặt cá nhân
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== MODAL CHI TIẾT TÀI KHOẢN ===== */}
      {isProfileModalOpen && (
        <div className="ch-modal-overlay">
          <div className="ch-modal-backdrop" onClick={() => setIsProfileModalOpen(false)} />
          <div className="ch-modal">
            <div className="ch-modal-hero">
              <div className="ch-modal-hero-top">
                <span className="ch-modal-hero-title">Thông tin tài khoản</span>
                <button className="ch-modal-close" onClick={() => setIsProfileModalOpen(false)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="ch-modal-avatar">{profileData?.fullName?.charAt(0).toUpperCase()}</div>
                <span className="ch-modal-username">{profileData?.fullName}</span>
              </div>
            </div>

            <div className="ch-modal-body">
              <div className="ch-modal-grid">
                <div className="ch-modal-field">
                  <div className="ch-modal-field-label"><Shield size={10} /> Vai trò hệ thống</div>
                  <div className="ch-modal-field-val">{profileData?.role}</div>
                </div>
                <div className="ch-modal-field">
                  <div className="ch-modal-field-label"><Calendar size={10} /> Ngày tham gia</div>
                  <div className="ch-modal-field-val">
                    {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </div>
                </div>
              </div>

              {profileData?.managedBuildings?.length > 0 && (
                <div className="ch-modal-field">
                  <div className="ch-modal-field-label"><MapPin size={10} /> Cơ sở quản lý trực tiếp</div>
                  <div className="ch-modal-building">
                    <div className="ch-modal-building-name">{profileData.managedBuildings[0].building.name}</div>
                    <div className="ch-modal-building-addr">{profileData.managedBuildings[0].building.address || 'Chưa cập nhật địa chỉ'}</div>
                    <div className="ch-modal-building-code">Mã: {profileData.managedBuildings[0].building.code}</div>
                  </div>
                </div>
              )}

              {profileData?.role === 'SUPER_ADMIN' && (
                <div className="ch-modal-superadmin">
                  <div className="ch-modal-superadmin-title">Quản trị viên toàn quyền</div>
                  <div className="ch-modal-superadmin-desc">Tài khoản có quyền truy cập tất cả các cơ sở trong hệ thống.</div>
                </div>
              )}
            </div>

            <div className="ch-modal-footer">
              <button className="ch-btn-secondary" onClick={() => setIsProfileModalOpen(false)}>Đóng</button>
              <button className="ch-btn-danger" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CÀI ĐẶT CÁ NHÂN ===== */}
      {isSettingsModalOpen && (
        <div className="ch-modal-overlay">
          <div className="ch-modal-backdrop" onClick={() => setIsSettingsModalOpen(false)} />
          <div className="ch-settings-modal">
            <div className="ch-settings-header">
              <span className="ch-settings-title">Cài đặt cá nhân</span>
              <button className="ch-modal-close" onClick={() => setIsSettingsModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdateName} className="ch-settings-form">
              <div>
                <label className="ch-settings-label">Thay đổi họ và tên</label>
                <input
                  type="text"
                  className="ch-settings-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" className="ch-btn-secondary" style={{ flex: 1 }} onClick={() => setIsSettingsModalOpen(false)}>Hủy</button>
                <button type="submit" className="ch-btn-primary" style={{ flex: 2 }} disabled={isUpdating}>
                  {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;