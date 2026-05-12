import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileCheck, AlertCircle, Database, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface PreviewData {
  type: string;
  headers: string[];
  rows: any[];
}

export default function DataImporter() {
  const [previews, setPreviews] = useState<Record<string, PreviewData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  const handleFileUpload = (type: 'YearPlan' | 'WOK340' | 'RDB', file: File) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        processCSV(type, results.data as string[][]);
        setLoading(prev => ({ ...prev, [type]: false }));
      },
      error: (error) => {
        console.error(`Error parsing ${type}:`, error);
        setLoading(prev => ({ ...prev, [type]: false }));
      }
    });
  };

  const processCSV = (type: string, data: string[][]) => {
    let processedRows: any[] = [];
    let headers: string[] = [];

    if (type === 'YearPlan') {
      // Find row with Course Number
      const startIndex = data.findIndex(row => row.some(cell => cell?.includes('รหัสวิชา') || cell?.includes('Course Number')));
      if (startIndex !== -1) {
        headers = ['Course Number', 'Course Title', 'Type'];
        const dataRows = data.slice(startIndex + 1);
        processedRows = dataRows.map(row => ({
          code: row[1]?.trim(),
          title: row[2]?.trim(),
          type: row[4]?.trim()
        })).filter(r => r.code && r.title);
      }
    } else if (type === 'WOK340') {
      // Logic: Curriculum Year in Row 7 (index 6)
      // Headers are mapping year columns
      headers = data[13] || []; // typical header row for mapping
      processedRows = data.slice(14).map(row => ({
        code: row[1]?.trim(),
        title: row[2]?.trim(),
        classSize: row[6]?.trim(), // example mapping
        type: row[5]?.trim()
      })).filter(r => r.code);
    } else if (type === 'RDB') {
      // BD col is roughly index 55 (0-based)
      headers = ['RoomNum', 'RoomSize', 'RoomType'];
      processedRows = data.slice(1).map(row => ({
        roomNum: row[1]?.trim(), // Column B usually
        roomSize: parseInt(row[2]?.trim() || '0'), // Column C
        roomType: row[55]?.trim() // Column BD
      })).filter(r => r.roomNum && r.roomSize > 0);
    }

    setPreviews(prev => ({
      ...prev,
      [type]: { type, headers, rows: processedRows.slice(0, 10) } // Preview first 10
    }));

    // For actual save processing
    (window as any)[`processed_${type}`] = processedRows;
  };

  const saveToFirebase = async (type: string) => {
    const data = (window as any)[`processed_${type}`];
    if (!data) return;

    setLoading(prev => ({ ...prev, [`save_${type}`]: true }));
    try {
      const batch = writeBatch(db);
      const collName = type === 'RDB' ? 'rooms_database' : 'master_courses';
      
      data.forEach((item: any) => {
        const ref = doc(collection(db, collName), item.code || item.roomNum);
        batch.set(ref, { 
          ...item, 
          source: type,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      setSuccess(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setSuccess(prev => ({ ...prev, [type]: false })), 3000);
    } catch (error) {
      handleFirestoreError(error, 'write' as any, type);
      alert(`Error saving ${type} data.`);
    } finally {
      setLoading(prev => ({ ...prev, [`save_${type}`]: false }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UploadZone 
          title="Year Plan CSV" 
          subtitle="Detect Course Number"
          onUpload={(f: File) => handleFileUpload('YearPlan', f)}
          isLoading={loading['YearPlan']}
          isPreviewOpen={!!previews['YearPlan']}
          onSave={() => saveToFirebase('YearPlan')}
          isSaving={loading['save_YearPlan']}
          isSuccess={success['YearPlan']}
          type="standard"
        />
        <UploadZone 
          title="วก.340 CSV" 
          subtitle="Map Class Size by Year"
          onUpload={(f: File) => handleFileUpload('WOK340', f)}
          isLoading={loading['WOK340']}
          isPreviewOpen={!!previews['WOK340']}
          onSave={() => saveToFirebase('WOK340')}
          isSaving={loading['save_WOK340']}
          isSuccess={success['WOK340']}
          type="accent"
        />
        <UploadZone 
          title="RDB_Main CSV" 
          subtitle="Cleaning Null Rooms"
          onUpload={(f: File) => handleFileUpload('RDB', f)}
          isLoading={loading['RDB']}
          isPreviewOpen={!!previews['RDB']}
          onSave={() => saveToFirebase('RDB')}
          isSaving={loading['save_RDB']}
          isSuccess={success['RDB']}
          type="standard"
        />
      </div>

      {/* Previews */}
      <div className="space-y-4">
        {Object.keys(previews).length === 0 && (
          <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-300 bg-white">
            <LayoutGrid size={32} className="mb-2 opacity-20" />
            <p className="text-xs font-semibold uppercase tracking-widest">No Data Processed</p>
          </div>
        )}
        {Object.keys(previews).map(key => {
          const preview = previews[key];
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  Processed Preview: <span className="text-blue-600 font-mono underline decoration-blue-200 underline-offset-4">{key}</span>
                </h3>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  Partial Sync View
                </span>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                    <tr>
                      {preview.headers.map(h => (
                        <th key={h} className="px-4 py-2.5 border-b border-slate-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-slate-700 divide-y divide-slate-50">
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-4 py-2 font-medium">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button className="flex-1 bg-white border border-slate-200 py-2 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all uppercase tracking-wider">
                  Download Cleaned CSV
                </button>
                <button 
                  onClick={() => saveToFirebase(key)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded text-[10px] font-bold hover:bg-blue-700 transition-all uppercase tracking-wider shadow-md shadow-blue-100"
                >
                  Commit to MasterDB
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadZone({ title, subtitle, onUpload, isLoading, isPreviewOpen, onSave, isSaving, isSuccess, type }: any) {
  const isAccent = type === 'accent';
  
  return (
    <div className={cn(
      "bg-white rounded-xl border-2 border-dashed p-4 flex flex-col items-center text-center transition-all relative group",
      isAccent ? "border-blue-300 bg-blue-50/20" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
    )}>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110 duration-200",
        isAccent ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400 group-hover:text-blue-500"
      )}>
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <Upload size={18} />
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{title}</p>
      <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter">{subtitle}</p>
      
      <div className="mt-4 w-full">
        {isPreviewOpen ? (
          <div className={cn(
            "text-[10px] font-bold py-1.5 px-3 rounded border transition-all",
            isSuccess 
              ? "bg-green-50 text-green-600 border-green-100" 
              : isAccent 
                ? "bg-blue-100 text-blue-600 border-blue-200" 
                : "bg-blue-50 text-blue-500 border-blue-100"
          )}>
            {isSaving ? 'Syncing...' : isSuccess ? 'Synced' : 'Ready to Parse'}
          </div>
        ) : (
          <div className="text-[10px] font-bold text-slate-300 py-1.5 uppercase tracking-wider">
            Empty
          </div>
        )}
      </div>
    </div>
  );
}
