export interface Record {
  id?: string;
  personName: string;
  eventTime: string;
  roomName: string;
  type: 'retiro' | 'devolucion';
  signatureData: string;
  relatedPickupId?: string | null;
  timestamp: any;
  returnInfo?: {
    personName: string;
    eventTime: string;
    timestamp: any;
    signatureData: string;
  };
}

export const ROOMS = [
  "Solgas Hogar", 
  "Solgas Energia", 
  "Auma", 
  "Espiritu Integro", 
  "Espiritu Colaborativo", 
  "Espiritu Agil",
  "Espiritu Innovador"
];
