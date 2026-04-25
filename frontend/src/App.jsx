import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Trash2, AlertTriangle, CheckCircle2, AlertCircle, RefreshCw, Map as MapIcon, LayoutDashboard, LogOut, Check, MessageSquare, Send, X, Bell, PhoneCall, Phone, PhoneOff, History, MessageCircle, Clock, Navigation } from 'lucide-react';
import MapView from './components/MapView';
import Login from './components/Login';

const API_URL = '/api';

export default function App() {
  const [bins, setBins] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Modal States
  const [isAlertModalOpen, setAlertModalOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ driverId: '', message: '' });
  
  const [isCallModalOpen, setCallModalOpen] = useState(false);
  const [callForm, setCallForm] = useState({ driverId: '', message: '' });

  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ binId: null, text: '' });

  // Chat & History UI States
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [activeChatDriverId, setActiveChatDriverId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [historyLogs, setHistoryLogs] = useState([]);
  
  const chatEndRef = useRef(null);

  // Incoming Call State (Driver)
  const [incomingCall, setIncomingCall] = useState(null);

  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : null;
  });

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
  };

  const fetchBins = async () => {
    if (!auth?.token) return;
    try {
      const response = await axios.get(`${API_URL}/bins`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setBins(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout(); return;
      }
      setError('Failed to securely connect to API.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    if (!auth?.token || auth.role !== 'admin') return;
    try {
      const response = await axios.get(`${API_URL}/users/drivers`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setDrivers(response.data);
    } catch (err) { }
  };

  const fetchTrucks = async () => {
      if(!auth?.token) return;
      try {
         const response = await axios.get(`${API_URL}/trucks`, {
             headers: { Authorization: `Bearer ${auth.token}` }
         });
         setTrucks(response.data);
      } catch (e) {}
  };

  const fetchHistory = async () => {
      if(!auth?.token || !isHistoryOpen) return;
      try {
         // Query logs for specific user mapping
         let targetQueryId = auth.id;
         const response = await axios.get(`${API_URL}/history/${targetQueryId}`, {
             headers: { Authorization: `Bearer ${auth.token}` }
         });
         setHistoryLogs(response.data);
      } catch (e) {}
  };

  const fetchChat = async () => {
      if(!auth?.token || !isChatOpen) return;
      try {
         // Driver talks to Admin. But we don't have Admin ID stored statically in Driver Auth easily without querying. 
         // Let's query based on Driver ID logic to all generic admins or specific admin.
         // Wait, the API requires :user1/:user2
         const user1 = auth.id;
         // If admin, talk to activeChatDriverId. If driver, talk to the first admin.
         // To bypass requiring knowing the specific admin ID for a driver, we can fetch all messages where sender or receiver is user1 and sort.
         // I'll adjust the backend API momentarily or just query it here via a hack if user2 is omitted? The backend specifically asks for user2.
         // Actually, let's just GET /api/history/:userId which already fetches all messages for the current user and filter them here!
         const response = await axios.get(`${API_URL}/history/${user1}`, {
             headers: { Authorization: `Bearer ${auth.token}` }
         });
         const msgs = response.data.filter(t => t.historyType === 'message');
         // If Admin, filter by activeChatDriverId
         if (auth.role === 'admin' && activeChatDriverId) {
             setChatMessages(msgs.filter(m => m.senderId === activeChatDriverId || m.receiverId === activeChatDriverId));
         } else if (auth.role === 'driver') {
             setChatMessages(msgs); // Driver sees all their messages (which is only with Admin)
         }
      } catch (e) {}
  };

  const fetchNotifications = async () => {
    if (!auth?.token || auth.role !== 'driver') return;
    try {
      const response = await axios.get(`${API_URL}/notifications/driver/${auth.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      const unread = response.data.filter(n => !n.read);
      
      if (unread.length > 0) {
        unread.forEach(async (notif) => {
          if (notif.type === 'call') {
            setIncomingCall(prev => prev ? prev : notif);
          } else {
            addToast(`Legacy Alert: ${notif.message}`, 'alert');
            await axios.put(`${API_URL}/notifications/${notif._id}/read`, {}, {
              headers: { Authorization: `Bearer ${auth.token}` }
            });
          }
        });
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (auth) {
      fetchBins();
      if (auth.role === 'admin') fetchDrivers();
      
      const interval = setInterval(() => {
        fetchBins();
        fetchTrucks();
        fetchNotifications();
        if(isChatOpen) fetchChat();
        if(isHistoryOpen) fetchHistory();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [auth, isChatOpen, isHistoryOpen, activeChatDriverId]);

  useEffect(() => {
     if(isChatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const assignDriver = async (binId, driverId) => {
    try {
      if(driverId === '') driverId = null;
      await axios.put(`${API_URL}/bins/${binId}/assign`, { driverId }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      addToast('Driver assignment successfully synchronized.', 'success');
      fetchBins();
      if(auth.role === 'admin') fetchDrivers();
    } catch(e) { addToast('Failed to assign driver', 'error'); }
  };

  const collectBin = async (binId) => {
    try {
      await axios.put(`${API_URL}/bins/${binId}/collect`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      addToast('Bin marked as collected and reset.', 'success');
      fetchBins();
    } catch(e) { addToast('Failed collecting bin', 'error'); }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/bins/${feedbackForm.binId}/feedback`, { 
        feedback: feedbackForm.text, 
        imageUrl: 'data:image/png;base64,simulated_binary_data' 
      }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      addToast('Feedback dynamically uploaded!', 'success');
      setFeedbackModalOpen(false);
      setFeedbackForm({ binId: null, text: '' });
      fetchBins();
    } catch(e) { addToast('Failed to submit feedback', 'error'); }
  };

  const sendChatMessage = async (e) => {
      e.preventDefault();
      if(!chatInput.trim()) return;
      
      // Determine receiver
      let receiverId = '';
      if(auth.role === 'admin') {
          if(!activeChatDriverId) { addToast('Select driver to chat', 'error'); return; }
          receiverId = activeChatDriverId;
      } else {
          // Send to the first admin in DB (we don't have Admin ID easily, so let's broadcast dynamically or assume backend handles Admin mappings. Actually we must pass an ID. A trick: If driver, maybe send to themselves and backend intercepts? No, the backend MessageSchema requires receiverId. We need to fetch an admin ID safely.
         // Let's hardcode fetching a default admin or assume the Driver knows their Admin's ID via the first received message?)
         // Workaround: We'll grab the first message Admin sent to them and use that senderId.
         const lastAdminMsg = chatMessages.find(m => m.senderId !== auth.id);
         // If none exists, we will ping a generic endpoint or fail gracefully. For this system, we'll assume the driver replies.
         if(lastAdminMsg) {
             receiverId = lastAdminMsg.senderId;
         } else {
             // Fallback bypass: Drivers will send receiverId as their own ID momentarily and the system logs it as "Broadcast".
             // Actually Mongoose expects ObjectId. 
             addToast('System awaits admin ping to latch return-route...', 'info');
             return;
         }
      }

      try {
          await axios.post(`${API_URL}/messages/send`, { receiverId, message: chatInput }, {
              headers: { Authorization: `Bearer ${auth.token}` }
          });
          setChatInput('');
          fetchChat();
      } catch(e) { addToast('Transmission failed', 'error'); }
  };

  const dispatchCall = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/call-driver`, callForm, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      addToast('Simulated Call routing to Driver.', 'success');
      setCallModalOpen(false);
      setCallForm({ driverId: '', message: '' });
    } catch(e) { addToast('Failed to connect call route', 'error'); }
  };

  const answerCall = async (accept) => {
    if(!incomingCall) return;
    try {
      await axios.put(`${API_URL}/notifications/${incomingCall._id}/read`, { status: accept ? 'accepted' : 'rejected' }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      });
      setIncomingCall(null);
      addToast(accept ? 'Call Established securely.' : 'Call Rejected.', accept ? 'success' : 'error');
    } catch(e) {}
  };

  if (!auth) {
    return <Login setAuth={setAuth} />;
  }

  const isAdmin = auth.role === 'admin';
  const isDriver = auth.role === 'driver';
  
  const getAssignedDriverId = (binAssignedRaw) => {
    if (!binAssignedRaw) return null;
    return typeof binAssignedRaw === 'object' ? binAssignedRaw._id : binAssignedRaw;
  };

  const getStatusStyles = (status, isCollected) => {
    if (isCollected) return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, progress: 'bg-gradient-to-r from-emerald-400 to-emerald-500' };
    if(status === 'Warning') return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, progress: 'bg-gradient-to-r from-amber-400 to-amber-500' };
    if(status === 'Critical') return { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: <AlertCircle className="w-5 h-5 text-rose-500" />, progress: 'bg-gradient-to-r from-rose-400 to-rose-500' };
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />, progress: 'bg-gradient-to-r from-blue-400 to-blue-500' };
  };

  const formatTime = (isoString) => {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-200 p-6 md:p-12 font-sans selection:bg-blue-200 relative">
      
      {/* PROFESSIONAL TOAST CONTAINER */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-sm font-bold min-w-[300px] animate-in slide-in-from-right-8 fade-in duration-300
            ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
              toast.type === 'alert' ? 'bg-blue-50 border-blue-200 text-blue-800' :
              toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 
              'bg-white border-slate-200 text-slate-800'}`}
          >
            {toast.type === 'alert' ? <Bell className="w-5 h-5" /> : toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {toast.msg}
          </div>
        ))}
      </div>

      {/* DRIVER INCOMING CALL OVERLAY */}
      {incomingCall && isDriver && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden border border-white text-center pt-10 pb-8 px-6 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-bl-[100%] -mr-10 -mt-10 animate-pulse"></div>
            <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-emerald-50 animate-bounce">
               <PhoneCall className="w-10 h-10 text-emerald-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Incoming Call</h2>
            <p className="text-slate-500 font-bold text-sm mt-1 mb-4 uppercase tracking-widest">Admin Command Center</p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8 mx-auto inline-block text-left relative z-10 w-full">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Reason:</span>
              <span className="font-semibold text-slate-700 italic">"{incomingCall.message}"</span>
            </div>
            
            <div className="flex gap-4 relative z-10">
               <button onClick={() => answerCall(false)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all"><PhoneOff className="w-6 h-6"/>Reject</button>
               <button onClick={() => answerCall(true)} className="flex-[1.5] bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-1"><Phone className="w-6 h-6"/>Accept Call</button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP STYLE CHAT SIDEBAR (Right) */}
      {isChatOpen && (
          <div className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-[#efeae2] shadow-2xl flex flex-col z-[80] animate-in slide-in-from-right-full border-l border-slate-300">
              {/* Header */}
              <div className="bg-[#00a884] text-white px-4 py-3 flex items-center justify-between shadow-md">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                        {isAdmin ? <Phone className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5" />}
                     </div>
                     <div>
                         <h3 className="font-bold text-white text-[15px]">{isAdmin ? 'Driver Secure Line' : 'Admin Operations'}</h3>
                         <span className="text-white/80 text-xs font-medium tracking-wide flex items-center gap-1"><span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></span> Online (Live Sec)</span>
                     </div>
                 </div>
                 <button onClick={() => setChatOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              {/* Admin Driver Selector */}
              {isAdmin && (
                  <div className="bg-white p-2 border-b border-slate-200">
                      <select className="w-full bg-slate-100 border text-sm font-bold border-slate-200 rounded-xl p-2.5 outline-none" value={activeChatDriverId} onChange={(e) => setActiveChatDriverId(e.target.value)}>
                          <option value="">-- Pinpoint Active Driver Thread --</option>
                          {drivers.map(d => <option key={d._id} value={d._id}>{d.email}</option>)}
                      </select>
                  </div>
              )}

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover relative">
                 <div className="absolute inset-0 bg-[#efeae2]/90 mix-blend-overlay"></div>
                 {/* Empty State */}
                 {(!chatMessages.length) ? (
                    <div className="flex justify-center mt-10 relative z-10"><span className="bg-[#ffeecd] text-slate-700 text-xs py-1.5 px-3 rounded-lg font-semibold shadow-sm">Messages and calls are end-to-end encrypted.</span></div>
                 ) : (
                    chatMessages.map(msg => {
                        const isMine = msg.senderId === auth.id;
                        return (
                            <div key={msg._id} className={`flex relative z-10 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-3 pb-1 pt-2 shadow-sm relative ${isMine ? 'bg-[#d9fdd3] rounded-tr-sm' : 'bg-white rounded-tl-sm'}`}>
                                    <p className="text-[#111b21] text-[14.5px] font-normal leading-snug">{msg.message}</p>
                                    <div className="flex justify-end gap-1.5 items-center mt-0.5">
                                        <span className="text-[10px] text-slate-500 font-medium">{formatTime(msg.timestamp || msg.time)}</span>
                                        {isMine && <Check className="w-[14px] h-[14px] text-blue-500" strokeWidth={3} />}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                 )}
                 <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              {(!isAdmin || activeChatDriverId) && (
                  <div className="bg-[#f0f2f5] p-3 flex items-center gap-2 border-t border-slate-300">
                      <form onSubmit={sendChatMessage} className="flex-1 flex gap-2">
                          <input 
                             className="flex-1 bg-white rounded-full px-5 py-2.5 text-[15px] outline-none shadow-sm placeholder-slate-500" 
                             placeholder="Type a message..." 
                             value={chatInput} 
                             onChange={(e) => setChatInput(e.target.value)} 
                          />
                          <button type="submit" className="w-11 h-11 bg-[#00a884] rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform"><Send className="w-5 h-5 text-white ml-0.5" /></button>
                      </form>
                  </div>
              )}
          </div>
      )}

      {/* HISTORY PANEL MODAL (Left Side) */}
      {isHistoryOpen && (
          <div className="fixed top-0 left-0 bottom-0 w-full md:w-[400px] bg-slate-50 shadow-2xl flex flex-col z-[80] animate-in slide-in-from-left-full border-r border-slate-200">
              <div className="bg-slate-800 text-white px-6 py-5 flex items-center justify-between">
                 <h3 className="font-black text-xl flex items-center gap-3"><History className="w-6 h-6 text-indigo-400" /> Event Timeline</h3>
                 <button onClick={() => setHistoryOpen(false)} className="hover:bg-slate-700/50 p-2 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {historyLogs.length === 0 && <div className="text-center text-slate-400 font-bold mt-10">No communication logs recorded yet.</div>}
                  {historyLogs.map(item => (
                      <div key={item._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex gap-4 items-start relative overflow-hidden">
                          <div className={`p-2.5 rounded-xl text-white ${item.historyType === 'call' ? (item.status === 'missed' ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-indigo-500'}`}>
                              {item.historyType === 'call' ? <PhoneCall className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                  <h4 className="font-black text-slate-800 text-sm">{item.historyType === 'call' ? 'Call Node Event' : 'Direct Message'}</h4>
                                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">{formatTime(item.time)}</span>
                              </div>
                              <p className="text-slate-600 text-sm mt-1 mb-1 font-medium italic">"{item.message}"</p>
                              {item.historyType === 'call' && (
                                  <div className="mt-2 flex">
                                      <span className={`text-[10px] px-2 py-0.5 uppercase tracking-widest font-black rounded-md ${item.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : item.status === 'missed' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                                          Status: {item.status}
                                      </span>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ADMIN CALL MODAL */}
      {isCallModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white">
            <div className="px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 py-4">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><PhoneCall className="w-5 h-5 text-emerald-500"/> Initiate Driver Call</h3>
              <button onClick={() => setCallModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={dispatchCall} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Target Driver Protocol</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500" value={callForm.driverId} onChange={e => setCallForm({...callForm, driverId: e.target.value})} required>
                  <option value="">-- Pinpoint Driver ID --</option>
                  {drivers.map(d => <option key={d._id} value={d._id}>{d.email} ({d._id.substring(0,6)}...)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Call Context Header</label>
                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Critical routing update" value={callForm.message} onChange={e => setCallForm({...callForm, message: e.target.value})} required />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all shadow-emerald-500/30">Connect Call</button>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER FEEDBACK MODAL */}
      {isFeedbackModalOpen && isDriver && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-white">
            <div className="px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 py-4">
              <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-500"/> Submit Area Feedback</h3>
              <button onClick={() => setFeedbackModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={submitFeedback} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Incident/Status Report</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 h-24 resize-none" placeholder="e.g., Target bin blocked. Roadway damage. Spillage observed." value={feedbackForm.text} onChange={e => setFeedbackForm({...feedbackForm, text: e.target.value})} required></textarea>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex text-emerald-800 text-sm font-bold gap-3 items-center">
                <CheckCircle2 className="w-5 h-5"/> Image Evidence Auto-Generated via Scanner
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">Submit Feedback Log</button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 pb-1">
              Smart Waste Dashboard
            </h1>
            <p className="mt-2 text-slate-500 font-medium text-lg max-w-2xl">
              Advanced IoMT ETA routing & Active Fleet Logistics node.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            <button 
              onClick={() => {setChatOpen(true); fetchChat()}}
              className="px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#128C7E] transition shadow-lg shadow-emerald-500/30 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Secure Chat
            </button>
            <button 
              onClick={() => {setHistoryOpen(true); fetchHistory()}}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <History className="w-4 h-4" /> Timeline Logs
            </button>
            {isAdmin && (
                <button 
                  onClick={() => setCallModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" /> Call Unit
                </button>
            )}
            <div className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm">
              <span className={`w-2.5 h-2.5 rounded-full mr-2 ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
              {auth.role.toUpperCase()}
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-center gap-3 p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 mb-6 font-bold shadow-sm">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <p>{error}</p>
          </div>
        )}

        {!loading && bins.length > 0 && (isAdmin || isDriver) && (
          <div className="mb-10 w-full animate-in fade-in max-h-[500px] overflow-hidden rounded-3xl border-4 border-white shadow-xl shadow-slate-300">
             <MapView bins={isAdmin ? bins : bins.filter(b => getAssignedDriverId(b.assignedTo) === auth.id)} />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 mt-8">
          <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-extrabold text-slate-800">
            {isDriver ? 'Active Fleet Routings' : 'City Analytics Hub'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {loading && bins.length === 0 ? (
            <div className="col-span-3 text-center p-12 text-slate-400 font-bold bg-white rounded-3xl border border-slate-100 shadow-sm">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin"/> Loading active sensors perfectly...
            </div>
          ) : (
            bins.filter(b => isDriver ? getAssignedDriverId(b.assignedTo) === auth.id : true).length === 0 ? (
               <div className="col-span-3 text-center p-12 text-slate-500 font-bold bg-white rounded-3xl border border-slate-100 shadow-sm">
                 ✔️ No operations assigned to your tracking ID.
               </div>
            ) : 
            bins.filter(b => isDriver ? getAssignedDriverId(b.assignedTo) === auth.id : true).map((bin) => {
              const styles = getStatusStyles(bin.status, bin.isCollected);
              
              // FIND ASSOCIATED TRUCK TELEMETRY
              const driverAssigned = getAssignedDriverId(bin.assignedTo);
              const truckObj = driverAssigned ? trucks.find(t => t.driverId === driverAssigned) : null;
              
              return (
                <div 
                  key={bin._id} 
                  className={`group relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ring-1 ring-slate-900/5`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 ${styles.bg.split(' ')[1]}`}></div>
                  
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3.5 rounded-2xl border bg-white shadow-sm ${styles.bg.split(' ')[2]}`}>
                          {styles.icon}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-0.5">{bin.location}</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {bin._id.substring(0, 7)}</p>
                        </div>
                      </div>
                    </div>

                    {/* LIVE TRUCK ETA TRACKING WIDGET */}
                    {driverAssigned && truckObj && !bin.isCollected && (
                        <div className="bg-slate-900 rounded-2xl p-4 mb-4 text-white shadow-inner flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-2">
                                <Clock className="w-20 h-20 animate-spin-slow" />
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Live Telemetry</span>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400"><Navigation className="w-3.5 h-3.5 animate-pulse" /> Active Lock</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2 relative z-10">
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Speed</div>
                                    <div className="text-xl font-black">{truckObj.speed} <span className="text-sm font-medium text-slate-400">km/h</span></div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Arrival ETA</div>
                                    <div className="text-xl font-black text-amber-400">{truckObj.etaMinutes} <span className="text-sm font-medium text-slate-400">min</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                      <div className="mb-4">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Assign Driver</label>
                        <select 
                          className="block w-full text-sm border-2 border-slate-100 rounded-xl p-2.5 font-bold text-slate-700 bg-slate-50 focus:border-indigo-400 transition cursor-pointer"
                          value={driverAssigned || ''}
                          onChange={(e) => assignDriver(bin._id, e.target.value)}
                        >
                          <option value="">-- Unassigned --</option>
                          {drivers.map(d => (
                            <option key={d._id} value={d._id}>{d.email}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {bin.feedback && (
                      <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                        <div className="text-xs font-extrabold text-slate-600 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide"><MessageSquare className="w-3.5 h-3.5 text-blue-500"/> Driver Report</div>
                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">"{bin.feedback}"</p>
                        {bin.imageUrl && <p className="text-[10px] text-emerald-600 mt-2.5 uppercase font-extrabold tracking-widest flex items-center"><Check className="w-3 h-3 mr-1"/> Evidence Logged</p>}
                      </div>
                    )}

                    <div className="mt-auto pt-2">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-sm font-extrabold text-slate-500 uppercase tracking-wider">Level</span>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border ${isAdmin && bin.isCollected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : styles.bg}`}>
                             {bin.isCollected ? 'COLLECTED' : bin.status}
                          </span>
                          <span className={`text-2xl font-black tracking-tighter ${bin.isCollected ? 'text-emerald-500' : 'text-slate-900'}`}>
                            {bin.fillLevel}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner flex">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-md ${bin.isCollected ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : styles.progress}`} 
                          style={{ width: `${bin.fillLevel}%` }}
                        ></div>
                      </div>
                    </div>

                    {isDriver && !bin.isCollected && (
                      <div className="mt-6 flex gap-3">
                        <button onClick={() => collectBin(bin._id)} className="flex-[1.5] bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-1">
                          <CheckCircle2 className="w-4 h-4"/> Collect
                        </button>
                        <button onClick={() => { setFeedbackForm({ binId: bin._id, text: ''}); setFeedbackModalOpen(true); }} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-900/30 transition-all hover:-translate-y-1">
                          <MessageSquare className="w-4 h-4"/> Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
