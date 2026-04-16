import React, { useState, useEffect } from 'react';
import API from '../api/api';

export default function TaskDetailModal({ task, onClose, onUpdate, currentUser, projectMembers = [] }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assigned_to);
  const [dueDate, setDueDate] = useState(task.due_date);
  
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null); // {id, text}
  
  const [file, setFile] = useState(null);

  const isAdmin = currentUser?.role === 'admin';
  const isAssignee = currentUser?.id === task.assigned_to;

  const handleUpdateTask = async () => {
    try {
      const payload = { status };
      
      if (isAdmin) {
        payload.title = title;
        payload.description = description;
        payload.assigned_to = assignedTo;
        payload.due_date = dueDate;
      }

      if (isAdmin || isAssignee) {
        await API.patch(`tasks/${task.id}/`, payload);
      }
      
      if (file && isAssignee) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('task', task.id);
        await API.post(`files/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      alert("Changes saved ");
      onUpdate();
      onClose();
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || "Action denied."));
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await API.post(`comments/`, { task: task.id, text: newComment });
      setComments([res.data, ...comments]);
      setNewComment("");
    } catch (err) {
      alert("Failed to post comment");
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await API.delete(`comments/${id}/`);
      setComments(comments.filter(c => c.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const startEdit = (c) => {
    setEditingComment({ id: c.id, text: c.text });
  };

  const handleSaveEdit = async () => {
    try {
      const res = await API.patch(`comments/${editingComment.id}/`, { text: editingComment.text });
      setComments(comments.map(c => c.id === editingComment.id ? res.data : c));
      setEditingComment(null);
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
      <div className="bg-white w-full max-w-5xl p-18 rounded-3xl shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
          <div className="flex-1 mr-4">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Task Details #{task.id}</span>
            {isAdmin ? (
                <input 
                    className="text-3xl font-black text-gray-800 w-full bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none pb-1 mt-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            ) : (
                <h2 className="text-3xl font-black text-gray-800 mt-2">{task.title}</h2>
            )}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-3xl transition">✕</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Status {(!isAssignee && !isAdmin) && "(Assignee Only)"}</label>
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        disabled={!isAssignee && !isAdmin}
                        className={`w-full mt-2 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500 ${(!isAssignee && !isAdmin) ? 'bg-gray-50 cursor-not-allowed text-gray-400' : 'bg-white shadow-sm'}`}
                    >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Assignee {!isAdmin && "(Admin Only)"}</label>
                    {isAdmin ? (
                        <select 
                            value={assignedTo} 
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full mt-2 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm"
                        >
                            <option value="">Unassigned</option>
                            {projectMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.username}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 font-bold">
                             {task.assigned_name || 'Unassigned'}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Deadline {!isAdmin && "(Admin Only)"}</label>
                    {isAdmin ? (
                        <input 
                            type="date"
                            value={dueDate} 
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full mt-2 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm"
                        />
                    ) : (
                        <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 font-bold">
                             {task.due_date || 'No deadline'}
                        </div>
                    )}
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Priority (Admin Only)</label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 font-black uppercase text-xs tracking-widest">
                        {task.priority || 'Medium'}
                    </div>
                </div>
            </div>
            
            <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Task Description {!isAdmin && "(Read Only)"}</label>
               {isAdmin ? (
                   <textarea 
                    className="w-full mt-2 text-gray-700 text-sm bg-gray-50 p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none min-h-[140px] font-medium leading-relaxed"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task details..."
                   />
               ) : (
                   <div className="mt-2 text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-5 rounded-2xl border border-gray-200 leading-relaxed">
                       {task.description || <span className="italic text-gray-400">No description provided.</span>}
                   </div>
               )}
            </div>

            <div className="pt-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-3 block">Files & Assets</label>
                <div className="grid grid-cols-2 gap-4">
                    {isAssignee && (
                      <div className="border border-dashed border-blue-200 bg-blue-50/30 p-4 rounded-xl">
                        <input 
                          type="file" 
                          id="file-upload"
                          onChange={(e) => setFile(e.target.files[0])}
                          className="hidden"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-700 flex flex-col items-center gap-2">
                           <span className="text-xl"></span>
                           {file ? file.name : "Click to Upload File"}
                        </label>
                      </div>
                    )}
                    
                    {task.files?.map(f => (
                        <a key={f.id} href={f.file} target="_blank" rel="noreferrer" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 group hover:border-blue-300 transition">
                            <span className="text-lg"></span>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-gray-800 truncate">Attachment #{f.id}</p>
                                <p className="text-[9px] text-gray-400">{new Date(f.uploaded_at).toLocaleDateString()}</p>
                            </div>
                        </a>
                    ))}
                    {!task.files?.length && !isAssignee && <p className="text-xs text-gray-300 italic">No attachments found.</p>}
                </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-4 block underline decoration-indigo-200 underline-offset-4">Activity Journal</label>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {task.history?.length > 0 ? [...task.history].reverse().map(h => (
                  <div key={h.id} className="text-[10px] bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                    <span className="font-black text-indigo-600">{h.changed_by_name}</span> updated <span className="font-bold">{h.field}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-red-400 line-through">{h.old_value}</span>
                        <span className="text-gray-300">→</span>
                        <span className="text-green-600 font-bold">{h.new_value}</span>
                    </div>
                    <div className="text-[9px] text-gray-400 mt-2 font-mono uppercase opacity-70">{new Date(h.timestamp).toLocaleString()}</div>
                  </div>
                )) : <p className="text-gray-300 text-[10px] italic">No activity recorded yet.</p>}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Team Discussion</label>
              
              <div className="flex-1 space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length > 0 ? comments.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group relative">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black uppercase">
                                {c.user_name[0]}
                            </div>
                            <span className="text-xs font-black text-gray-800">{c.user_name}</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                            {new Date(c.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    {editingComment?.id === c.id ? (
                        <div className="mt-2">
                            <textarea 
                                className="w-full p-2 text-xs border rounded-lg focus:ring-1 focus:ring-blue-400 outline-none"
                                value={editingComment.text}
                                onChange={(e) => setEditingComment({...editingComment, text: e.target.value})}
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleSaveEdit} className="text-[10px] font-bold text-green-600">Save</button>
                                <button onClick={() => setEditingComment(null)} className="text-[10px] font-bold text-gray-400">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600 leading-relaxed">{c.text}</p>
                    )}

                    {(currentUser?.id === c.user || isAdmin) && !editingComment && (
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            {currentUser?.id === c.user && (
                                <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-blue-500" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            )}
                            <button onClick={() => handleDeleteComment(c.id)} className="text-gray-400 hover:text-red-500" title="Delete">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                  </div>
                )) : <p className="text-center py-6 text-gray-300 text-xs italic">Start a conversation...</p>}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-2">
                    <textarea 
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-medium shadow-sm" 
                        placeholder="Share an update with the team..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                    />
                    <button 
                        onClick={handlePostComment}
                        disabled={!newComment.trim()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition self-end disabled:opacity-50"
                    >
                        Post Note
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t mt-10">
          <button onClick={onClose} className="font-black text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest transition">Cancel</button>
          <button onClick={handleUpdateTask} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition active:scale-95">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
