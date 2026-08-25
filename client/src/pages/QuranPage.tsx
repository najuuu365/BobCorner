import React, { useEffect, useState } from 'react';
import { AudioLines, BookOpen, CheckCircle2, Trash2, Upload } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../context/ToastContext';
import { quranApi, QuranAudioFile } from '../services/quranApi';

export const QuranPage: React.FC = () => {
  const { showToast } = useToast();
  const [files, setFiles] = useState<QuranAudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  const loadFiles = async () => {
    setFiles(await quranApi.getFiles());
    setLoading(false);
  };

  useEffect(() => { loadFiles().catch(() => setLoading(false)); }, []);

  useEffect(() => {
    const urls = Object.fromEntries(files.map((file) => [file.id, URL.createObjectURL(file.blob)]));
    setAudioUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    for (const file of selected) {
      if (!file.type.startsWith('audio/')) { showToast(`${file.name} is not an audio file.`, 'error'); continue; }
      await quranApi.addFile(file);
    }
    if (selected.length > 0) { await loadFiles(); showToast('Audio added to your Quran library.', 'success'); }
  };

  const handleDelete = async (file: QuranAudioFile) => {
    if (!window.confirm(`Remove ${file.name} from this browser?`)) return;
    await quranApi.deleteFile(file.id);
    setFiles((previous) => previous.filter((item) => item.id !== file.id));
    if (activeId === file.id) setActiveId(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><Badge variant="primary">Quiet listening space</Badge><h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">Quran Listener <AudioLines className="w-6 h-6 text-emerald-600" /></h1><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep recitations in this browser and listen without a server.</p></div>
        <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium cursor-pointer hover:bg-emerald-700"><Upload className="w-4 h-4" /> Upload audio<input type="file" accept="audio/*" multiple onChange={handleUpload} className="hidden" /></label>
      </div>
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"><div className="flex items-start gap-3"><BookOpen className="w-5 h-5 text-emerald-700 mt-0.5" /><div><h2 className="font-serif font-semibold text-slate-900 dark:text-white">Your listening shelf</h2><p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Upload MP3, M4A, OGG, or other browser-supported recitations. Files stay on this device.</p></div></div></Card>
      {loading ? <p className="text-sm text-slate-400 text-center py-12">Loading your listening shelf...</p> : files.length === 0 ? <Card className="text-center py-14 space-y-3"><AudioLines className="w-10 h-10 mx-auto text-slate-300" /><p className="font-serif font-semibold text-slate-800 dark:text-white">Your shelf is empty</p><p className="text-xs text-slate-500">Upload a recitation to begin listening.</p></Card> : <div className="grid gap-4">{files.map((file) => <Card key={file.id} className="space-y-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><h3 className="font-serif font-semibold text-slate-900 dark:text-white truncate">{file.name}</h3><p className="text-[11px] text-slate-500">Added {new Date(file.createdAt).toLocaleDateString()}</p></div><button onClick={() => handleDelete(file)} className="p-2 text-slate-400 hover:text-rose-500" title="Delete audio"><Trash2 className="w-4 h-4" /></button></div><audio controls preload="metadata" src={audioUrls[file.id]} className="w-full" onPlay={() => { setActiveId(file.id); quranApi.markPlayed(file.id); }} />{activeId === file.id && <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /> Now playing</span>}</Card>)}</div>}
    </div>
  );
};
