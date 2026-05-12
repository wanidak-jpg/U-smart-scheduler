import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Users } from 'lucide-react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, query, getDocs, setDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { MajorConfig } from '../../types';

export default function MajorConfigView() {
  const [configs, setConfigs] = useState<MajorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const q = query(collection(db, 'major_configs'));
      const querySnapshot = await getDocs(q);
      const fetchedConfigs: MajorConfig[] = [];
      querySnapshot.forEach((doc) => {
        fetchedConfigs.push({ id: doc.id, ...doc.data() } as MajorConfig);
      });
      setConfigs(fetchedConfigs);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMajor = () => {
    if (configs.length >= 5) return;
    const newMajor: MajorConfig = {
      name: '',
      year: 1,
      semester: 1,
      batch: '1/1',
      plan: 'Normal',
      studentCount: 0,
      curriculumYear: 2564
    };
    setConfigs([...configs, newMajor]);
  };

  const updateMajor = (index: number, field: keyof MajorConfig, value: any) => {
    const updated = [...configs];
    updated[index] = { ...updated[index], [field]: value };
    setConfigs(updated);
  };

  const removeMajor = async (index: number) => {
    const config = configs[index];
    if (config.id) {
      try {
        await deleteDoc(doc(db, 'major_configs', config.id));
      } catch (error) {
        handleFirestoreError(error, 'delete' as any, 'major_configs');
      }
    }
    const updated = configs.filter((_, i) => i !== index);
    setConfigs(updated);
  };

  const saveConfigs = async () => {
    setSaving(true);
    try {
      for (const config of configs) {
        const id = config.id || doc(collection(db, 'major_configs')).id;
        await setDoc(doc(db, 'major_configs', id), {
          ...config,
          id,
          updatedAt: serverTimestamp()
        });
      }
      alert('Configurations saved successfully!');
      fetchConfigs();
    } catch (error) {
      handleFirestoreError(error, 'write' as any, 'major_configs');
      alert('Error saving configuration. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const totalStudents = configs.reduce((sum, c) => sum + (Number(c.studentCount) || 0), 0);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-12 bg-gray-200 rounded w-full"></div></div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            Major Configuration
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
              major_configs
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Students</span>
            <span className="text-sm font-bold text-blue-600">{totalStudents}</span>
          </div>
          <button
            onClick={addMajor}
            disabled={configs.length >= 5}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-all text-xs font-semibold"
          >
            <Plus size={14} />
            Add Major
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
            <div className="col-span-4">Major Name</div>
            <div className="col-span-1">Year</div>
            <div className="col-span-1">Sem</div>
            <div className="col-span-1">Batch</div>
            <div className="col-span-2">Plan</div>
            <div className="col-span-1">Curr.</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-1"></div>
          </div>
          
          <div className="space-y-3">
            {configs.length === 0 && (
              <div className="py-8 text-center text-slate-300 text-xs italic bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                No majors defined. Click "Add Major" to start.
              </div>
            )}
            {configs.map((config, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <div className="col-span-4">
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => updateMajor(idx, 'name', e.target.value)}
                    placeholder="e.g. Computer Eng."
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="col-span-1">
                  <select
                    value={config.year}
                    onChange={(e) => updateMajor(idx, 'year', parseInt(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none bg-white"
                  >
                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <select
                    value={config.semester}
                    onChange={(e) => updateMajor(idx, 'semester', parseInt(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none bg-white"
                  >
                    {[1, 2, 3].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    value={config.batch}
                    onChange={(e) => updateMajor(idx, 'batch', e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={config.plan}
                    onChange={(e) => updateMajor(idx, 'plan', e.target.value as any)}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Co-op">Co-op</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    value={config.curriculumYear}
                    onChange={(e) => updateMajor(idx, 'curriculumYear', parseInt(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    value={config.studentCount}
                    onChange={(e) => updateMajor(idx, 'studentCount', parseInt(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded focus:border-blue-500 outline-none font-bold text-right"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button onClick={() => removeMajor(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 bg-slate-50 border-t border-slate-200">
        <button
          onClick={saveConfigs}
          disabled={saving || configs.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-bold text-xs shadow-lg shadow-blue-200"
        >
          <Save size={16} />
          {saving ? 'Synchronizing...' : 'Save Configuration to Firestore'}
        </button>
      </div>
    </div>
  );
}
