import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, Film, Link2, Trash2, Eye, Download,
  CheckCircle, AlertCircle, Loader, BookOpen, Plus, X
} from 'lucide-react';
import api from '../services/api';

// ── File type helpers ────────────────────────────────────────────────────────
const fileIconMap = {
  pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', label: 'PDF' },
  video: { icon: Film,     color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Video' },
  link: { icon: Link2,    color: 'text-cyan-400',  bg: 'bg-cyan-500/10',   label: 'Link' },
  doc: { icon: FileText, color: 'text-blue-400',   bg: 'bg-blue-500/10',  label: 'Doc' },
};

const getFileType = (filename) => {
  if (!filename) return 'doc';
  const ext = filename.split('.').pop().toLowerCase();
  if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) return 'doc';
  return 'doc';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── Upload progress bar ──────────────────────────────────────────────────────
function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Single material card ─────────────────────────────────────────────────────
function MaterialCard({ material, courseId, onDelete }) {
  const type = material.type || getFileType(material.url);
  const { icon: Icon, color, bg, label } = fileIconMap[type] || fileIconMap.doc;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all group">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{material.title || 'Untitled'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${bg} ${color} font-medium`}>{label}</span>
          <span className="text-xs text-slate-500">
            {material.uploadedAt ? new Date(material.uploadedAt).toLocaleDateString('en-IN') : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {material.url && (
          <a
            href={material.url.startsWith('http') ? material.url : `http://localhost:5000${material.url}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="View"
          >
            <Eye size={15} />
          </a>
        )}
        <button
          onClick={() => onDelete(material._id)}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UploadLecture() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Upload form state
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'link'
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkType, setLinkType] = useState('link');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Fetch faculty courses
  useEffect(() => {
    api.get('/courses?limit=50')
      .then(res => setCourses(res.data.courses || []))
      .catch(console.error)
      .finally(() => setLoadingCourses(false));
  }, []);

  // Fetch materials when course is selected
  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setLoadingMaterials(true);
    try {
      const res = await api.get(`/courses/${course._id}`);
      setMaterials(res.data.course?.materials || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Handle file drop / select
  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = /\.(mp4|webm|pdf|doc|docx|ppt|pptx|jpg|jpeg|png)$/i;
    if (!allowed.test(file.name)) {
      setErrorMsg('Unsupported file type. Allowed: MP4, PDF, DOC, PPT, images.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 50 MB.');
      return;
    }
    setSelectedFile(file);
    setErrorMsg('');
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  // Upload file to backend
  const handleUpload = async () => {
    if (!selectedCourse) { setErrorMsg('Please select a course first.'); return; }
    if (!title.trim()) { setErrorMsg('Please enter a title.'); return; }

    if (uploadMode === 'link') {
      if (!linkUrl.trim()) { setErrorMsg('Please enter a URL.'); return; }
      try {
        setUploadStatus('uploading');
        const res = await api.post(`/courses/${selectedCourse._id}/materials`, {
          title: title.trim(),
          type: linkType,
          url: linkUrl.trim(),
        });
        setMaterials(res.data.course?.materials || materials);
        resetForm();
        setUploadStatus('success');
        setTimeout(() => setUploadStatus(null), 3000);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Upload failed');
        setUploadStatus('error');
      }
      return;
    }

    if (!selectedFile) { setErrorMsg('Please select a file.'); return; }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title.trim());
    formData.append('type', getFileType(selectedFile.name));

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const res = await api.post(
        `/courses/${selectedCourse._id}/materials`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(pct);
          },
        }
      );
      setMaterials(res.data.course?.materials || materials);
      resetForm();
      setUploadStatus('success');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Upload failed. Check file size & type.');
      setUploadStatus('error');
    }
  };

  const resetForm = () => {
    setTitle('');
    setSelectedFile(null);
    setLinkUrl('');
    setUploadProgress(0);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    // NOTE: backend delete endpoint can be added; for now we remove from UI
    setMaterials(prev => prev.filter(m => m._id !== materialId));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload size={24} className="text-indigo-400" /> Upload Lecture Materials
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload PDFs, videos, notes, or add YouTube/Google Drive links for your students.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left: Course selector ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 h-fit">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Select Course
          </h3>
          {loadingCourses ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <Loader size={16} className="animate-spin" /> Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-6">
              <BookOpen size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No courses yet.</p>
              <a href="/dashboard" className="text-indigo-400 text-xs hover:underline">Create a course first</a>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {courses.map(course => (
                <button
                  key={course._id}
                  onClick={() => selectCourse(course)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedCourse?._id === course._id
                      ? 'border-indigo-500 bg-indigo-600/10'
                      : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/40'
                  }`}
                >
                  <p className="text-sm text-white font-medium truncate">{course.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {course.materials?.length || 0} materials · {course.enrolledStudents?.length || 0} students
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Upload form + materials list ───────────────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Upload Card */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedCourse ? `Upload to: ${selectedCourse.title}` : 'Select a course to upload'}
            </h3>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUploadMode('file')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  uploadMode === 'file' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Upload size={14} /> Upload File
              </button>
              <button
                onClick={() => setUploadMode('link')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  uploadMode === 'link' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Link2 size={14} /> Add Link
              </button>
            </div>

            {/* Title input */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-1 block">Material Title *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lecture 1 — Introduction to Python"
                className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors text-sm"
              />
            </div>

            {/* FILE upload area */}
            {uploadMode === 'file' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : selectedFile
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp4,.webm,.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={e => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto">
                      {getFileType(selectedFile.name) === 'video'
                        ? <Film size={24} className="text-purple-400" />
                        : <FileText size={24} className="text-red-400" />
                      }
                    </div>
                    <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-slate-400 text-xs">{formatSize(selectedFile.size)}</p>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedFile(null); setTitle(''); }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto"
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={32} className="text-slate-500 mx-auto" />
                    <p className="text-white text-sm font-medium">
                      Drop file here or <span className="text-indigo-400">browse</span>
                    </p>
                    <p className="text-slate-500 text-xs">MP4, PDF, DOC, PPT — max 50 MB</p>
                  </div>
                )}
              </div>
            )}

            {/* LINK input */}
            {uploadMode === 'link' && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">URL *</label>
                  <input
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or Google Drive link"
                    className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Type</label>
                  <div className="flex gap-2">
                    {['link', 'video', 'pdf'].map(t => (
                      <button
                        key={t}
                        onClick={() => setLinkType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          linkType === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Common link shortcuts */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '▶ YouTube', prefix: 'https://youtube.com/' },
                    { label: '📁 Drive', prefix: 'https://drive.google.com/' },
                    { label: '📊 Slides', prefix: 'https://docs.google.com/presentation/' },
                  ].map(({ label, prefix }) => (
                    <button
                      key={label}
                      onClick={() => setLinkUrl(prefix)}
                      className="text-xs bg-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded-md transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mt-3 text-red-400 text-xs">
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            {/* Upload progress */}
            {uploadStatus === 'uploading' && uploadMode === 'file' && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Uploading...</span><span>{uploadProgress}%</span>
                </div>
                <ProgressBar progress={uploadProgress} />
              </div>
            )}

            {/* Success */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 mt-3 text-green-400 text-xs">
                <CheckCircle size={14} /> Material uploaded successfully!
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleUpload}
              disabled={!selectedCourse || uploadStatus === 'uploading'}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all"
            >
              {uploadStatus === 'uploading' ? (
                <><Loader size={16} className="animate-spin" /> Uploading...</>
              ) : (
                <><Plus size={16} /> Add Material</>
              )}
            </button>
          </div>

          {/* Materials list */}
          {selectedCourse && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Uploaded Materials
                  <span className="ml-2 text-sm text-slate-400 font-normal">({materials.length})</span>
                </h3>
              </div>

              {loadingMaterials ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                  <Loader size={16} className="animate-spin" /> Loading...
                </div>
              ) : materials.length === 0 ? (
                <div className="text-center py-8">
                  <Upload size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No materials uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {materials.map((mat, i) => (
                    <MaterialCard
                      key={mat._id || i}
                      material={mat}
                      courseId={selectedCourse._id}
                      onDelete={handleDeleteMaterial}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* How it works guide */}
      <div className="glass rounded-2xl p-5 border-indigo-500/10">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">📖 Supported Formats</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Film, color: 'text-purple-400', bg: 'bg-purple-500/10', title: 'Video Lectures', desc: 'MP4, WebM — up to 50 MB', tips: 'Compress to 720p for low bandwidth' },
            { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', title: 'PDF Notes', desc: 'Slides, handouts, papers', tips: 'Students can download and read offline' },
            { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Documents', desc: 'DOC, DOCX, PPT, PPTX', tips: 'Lecture slides, assignments' },
            { icon: Link2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', title: 'External Links', desc: 'YouTube, Google Drive', tips: 'Best for low bandwidth areas' },
          ].map(({ icon: Icon, color, bg, title, desc, tips }) => (
            <div key={title} className={`${bg} rounded-xl p-3 border border-slate-700/30`}>
              <div className={`flex items-center gap-2 mb-1`}>
                <Icon size={16} className={color} />
                <span className="text-sm font-medium text-white">{title}</span>
              </div>
              <p className="text-xs text-slate-400">{desc}</p>
              <p className="text-xs text-slate-500 mt-1 italic">💡 {tips}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
