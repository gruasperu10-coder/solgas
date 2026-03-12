import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { Record as PickupRecord, ROOMS } from '../types';
import { Loader2, PenLine, Trash2, CheckCircle2, Clock, Calendar as CalendarIcon, MapPin, ArrowUpCircle, ArrowDownCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RegistrationFormProps {
  type: 'retiro' | 'devolucion';
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ type }) => {
  const [personName, setPersonName] = useState('');
  const [eventTime, setEventTime] = useState(format(new Date(), 'HH:mm'));
  const [roomName, setRoomName] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<PickupRecord | null>(null);
  const [loadingPickups, setLoadingPickups] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setEventTime(format(new Date(), 'HH:mm'));
    setSuccess(false);
    setSelectedPickup(null);
    setRoomName('');
    setPersonName('');

    if (type === 'devolucion') {
      fetchPickups();
    }
  }, [type]);

  const fetchPickups = async () => {
    setLoadingPickups(true);
    const path = 'records';
    try {
      const { getDocs, query, orderBy, limit } = await import('firebase/firestore');
      
      // Fetch all records (both retiro and devolucion) to link them
      const q = query(
        collection(db, path), 
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const allRecords = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const retiroRecords = allRecords.filter(r => r.type === 'retiro');
      const devolucionRecords = allRecords.filter(r => r.type === 'devolucion');

      const data = retiroRecords.map(retiro => {
        const returnRecord = devolucionRecords.find(d => d.relatedPickupId === retiro.id);
        return {
          ...retiro,
          returnInfo: returnRecord ? {
            personName: returnRecord.personName,
            eventTime: returnRecord.eventTime,
            timestamp: returnRecord.timestamp,
            signatureData: returnRecord.signatureData
          } : undefined
        };
      }) as PickupRecord[];

      setPickups(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoadingPickups(false);
    }
  };

  const handleSelectPickup = (pickup: PickupRecord) => {
    setSelectedPickup(pickup);
    setRoomName(pickup.roomName);
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) {
      alert('Por favor, seleccione una sala.');
      return;
    }
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert('Por favor, proporcione una firma.');
      return;
    }

    setIsSubmitting(true);
    const path = 'records';
    try {
      const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      
      await addDoc(collection(db, path), {
        personName,
        eventTime,
        roomName,
        type,
        signatureData,
        relatedPickupId: selectedPickup?.id || null,
        timestamp: serverTimestamp(),
      });

      setSuccess(true);
      setPersonName('');
      setRoomName('');
      setEventTime(format(new Date(), 'HH:mm'));
      setSelectedPickup(null);
      sigCanvas.current.clear();
      
      setTimeout(() => setSuccess(false), 3000);
      if (type === 'devolucion') {
        fetchPickups();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRetiro = type === 'retiro';

  if (!isRetiro && !selectedPickup) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-6">
          <ArrowDownCircle className="w-6 h-6 text-blue-600" />
          Seleccione el Retiro a Devolver
        </h2>
        
        {loadingPickups ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : pickups.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {pickups.map((pickup) => (
              <button
                key={pickup.id}
                onClick={() => handleSelectPickup(pickup)}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all text-left group relative overflow-hidden ${
                  pickup.returnInfo 
                    ? 'bg-gray-50 border-gray-200 opacity-80' 
                    : 'bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {pickup.returnInfo && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold uppercase tracking-wider">
                    Devuelto
                  </div>
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-700">{pickup.personName}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {pickup.roomName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {pickup.eventTime}
                    </span>
                  </div>
                </div>
                <div className="mt-2 sm:mt-0 text-xs font-medium text-gray-400">
                  {pickup.timestamp?.toDate ? format(pickup.timestamp.toDate(), "d 'de' MMM", { locale: es }) : ''}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">No hay retiros recientes para devolver.</p>
          </div>
        )}
      </div>
    );
  }

  if (!isRetiro && selectedPickup?.returnInfo) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setSelectedPickup(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Resumen de Ciclo Completado
          </h2>
        </div>

        <div className="space-y-8">
          <div className="relative pl-8 border-l-2 border-dashed border-gray-200 space-y-6">
            {/* Pickup Info */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Retiro</span>
                  <span className="text-xs text-emerald-600 font-medium">
                    {selectedPickup.timestamp?.toDate ? format(selectedPickup.timestamp.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : selectedPickup.eventTime}
                  </span>
                </div>
                <p className="font-semibold text-emerald-900 text-lg">{selectedPickup.personName}</p>
                <p className="text-sm text-emerald-700 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {selectedPickup.roomName}
                </p>
                <div className="mt-4 pt-4 border-t border-emerald-200/50">
                  <p className="text-[10px] text-emerald-600 uppercase font-bold mb-2">Firma de Retiro</p>
                  <img src={selectedPickup.signatureData} alt="Firma Retiro" className="h-16 object-contain bg-white/50 rounded-lg p-1" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            {/* Return Info */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Devolución</span>
                  <span className="text-xs text-blue-600 font-medium">
                    {selectedPickup.returnInfo.timestamp?.toDate ? format(selectedPickup.returnInfo.timestamp.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : selectedPickup.returnInfo.eventTime}
                  </span>
                </div>
                <p className="font-semibold text-blue-900 text-lg">{selectedPickup.returnInfo.personName}</p>
                <p className="text-sm text-blue-700 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {selectedPickup.roomName}
                </p>
                <div className="mt-4 pt-4 border-t border-blue-200/50">
                  <p className="text-[10px] text-blue-600 uppercase font-bold mb-2">Firma de Devolución</p>
                  <img src={selectedPickup.returnInfo.signatureData} alt="Firma Devolución" className="h-16 object-contain bg-white/50 rounded-lg p-1" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedPickup(null)}
            className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {!isRetiro && selectedPickup && (
              <button
                onClick={() => setSelectedPickup(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                title="Volver a la lista"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              {isRetiro ? (
                <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <ArrowDownCircle className="w-6 h-6 text-blue-600" />
              )}
              Nuevo Registro de {isRetiro ? 'Retiro' : 'Devolución'}
            </h2>
          </div>
          {!isRetiro && selectedPickup && (
            <p className="text-sm text-gray-500 ml-10">
              Devolviendo retiro de: <span className="font-medium text-blue-600">{selectedPickup.personName}</span> ({selectedPickup.roomName})
            </p>
          )}
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm font-medium ${
          isRetiro ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'
        }`}>
          <CalendarIcon className="w-4 h-4" />
          <span>
            {format(currentDate, "EEEE, d 'de' MMMM", { locale: es })}
          </span>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          ¡Registro de {type} guardado exitosamente!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Nombre de la persona que {isRetiro ? 'recoje' : 'entrega'}
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border border-gray-200 outline-none transition-all focus:ring-2 ${
                isRetiro ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'
              }`}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              Horario de {isRetiro ? 'recojo' : 'entrega'}
            </label>
            <input
              type="time"
              required
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border border-gray-200 outline-none transition-all focus:ring-2 ${
                isRetiro ? 'focus:ring-emerald-500' : 'focus:ring-blue-500'
              }`}
            />
          </div>
        </div>

        {isRetiro ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              Seleccionar Sala
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ROOMS.map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => setRoomName(room)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-medium border transition-all text-center ${
                    roomName === room
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400" />
              Sala (Automático)
            </label>
            <div className="px-4 py-2 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 font-medium">
              {roomName}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">Firma de Conformidad</label>
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Limpiar
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: "w-full h-40 cursor-crosshair"
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
            isRetiro 
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Guardando...
            </>
          ) : (
            `Registrar ${isRetiro ? 'Retiro' : 'Devolución'}`
          )}
        </button>
      </form>
    </div>
  );
};
