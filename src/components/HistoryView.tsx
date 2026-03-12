import React, { useEffect, useState } from 'react';
import { db, collection, query, orderBy, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { Record } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, History, Calendar, User, Clock, FileSignature, MapPin, ArrowUpCircle, ArrowDownCircle, Tag } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'records';
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Record[];
      setRecords(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRecords = records.filter(record => {
    const search = searchTerm.toLowerCase();
    return (
      record.personName.toLowerCase().includes(search) ||
      record.roomName.toLowerCase().includes(search) ||
      record.type.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" />
          Historial de Movimientos
        </h2>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre, sala o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full md:w-80"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 hover:border-indigo-200 transition-all group">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {record.timestamp?.toDate ? format(record.timestamp.toDate(), "d 'de' MMMM, yyyy", { locale: es }) : 'Cargando...'}
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      record.type === 'retiro' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {record.type === 'retiro' ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                      {record.type}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        Persona
                      </div>
                      <p className="font-medium text-gray-900">{record.personName}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        Sala
                      </div>
                      <p className="font-medium text-gray-700">{record.roomName}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        Horario
                      </div>
                      <p className="font-medium text-indigo-600">{record.eventTime}</p>
                    </div>
                  </div>
                </div>

                <div className="md:w-48 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <FileSignature className="w-3 h-3" />
                    Firma
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-center justify-center">
                    <img 
                      src={record.signatureData} 
                      alt="Firma" 
                      className="max-h-24 object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">No se encontraron registros.</p>
        </div>
      )}
    </div>
  );
};
