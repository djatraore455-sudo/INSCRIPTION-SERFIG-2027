import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Participant, SeminarConfig } from '../types';
import { AeemciLogo } from './AeemciLogo';
import { Printer, Download, CheckCircle, Clock, ShieldCheck, User, QrCode as QrIcon } from 'lucide-react';

interface BadgeCardProps {
  participant: Participant;
  config: SeminarConfig;
  showActions?: boolean;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ participant, config, showActions = true }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR Code containing verification data
    const qrPayload = JSON.stringify({
      m: participant.matricule,
      n: participant.fullName,
      t: participant.type,
      s: participant.subCommittee,
      p: participant.paymentStatus,
      c: config.acronym,
      r: config.region
    });

    QRCode.toDataURL(qrPayload, {
      width: 220,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, [participant, config]);

  const handlePrint = () => {
    window.print();
  };

  const getRoleHeaderColor = () => {
    switch (participant.type) {
      case 'formateur':
        return 'from-blue-700 via-blue-800 to-indigo-900 border-blue-500';
      case 'commission':
        return 'from-orange-600 via-orange-700 to-amber-800 border-orange-500';
      default:
        return 'from-emerald-700 via-emerald-800 to-teal-900 border-emerald-500';
    }
  };

  const getRoleBadgeTitle = () => {
    switch (participant.type) {
      case 'formateur':
        return 'FORMATEUR OFFICIEL';
      case 'commission':
        return `COMMISSION : ${(participant.commission || 'ORGANISATION').toUpperCase()}`;
      default:
        return 'SÉMINARISTE';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Printable Badge Container */}
      <div 
        id={`badge-${participant.matricule}`}
        className="printable-badge-area w-[330px] sm:w-[360px] bg-white rounded-3xl shadow-2xl border-4 border-emerald-800 overflow-hidden relative text-slate-800 select-none"
      >
        {/* Lanyard punch hole simulation */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-200 rounded-full border border-slate-300 z-20 flex items-center justify-center">
          <div className="w-9 h-1.5 bg-slate-400 rounded-full"></div>
        </div>

        {/* Top Header */}
        <div className={`pt-6 pb-3.5 px-4 bg-gradient-to-r ${getRoleHeaderColor()} text-white text-center relative border-b-2`}>
          <div className="flex items-center justify-between gap-2.5">
            <AeemciLogo size="sm" src={config.logoUrl} className="bg-white rounded-xl p-1 shadow-xs" />
            <div className="flex-1 text-center">
              <span className="text-[10px] tracking-widest uppercase font-black text-orange-300 block">
                AEEMCI • RÉGION DU GÔH ({config.location.city.toUpperCase()})
              </span>
              <h3 className="font-black text-base sm:text-lg tracking-wide text-white leading-tight mt-0.5">
                {config.editionName}
              </h3>
              <p className="text-[9px] text-emerald-100 font-medium line-clamp-1">{config.fullTitle}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white font-black text-[10px]">
              {config.durationDays}J
            </div>
          </div>
        </div>

        {/* Category Ribbon */}
        <div className={`py-1.5 px-3 text-center font-black tracking-wider text-xs uppercase shadow-inner ${
          participant.type === 'formateur' 
            ? 'bg-blue-600 text-white' 
            : participant.type === 'commission'
              ? 'bg-orange-500 text-white'
              : 'bg-emerald-600 text-white'
        }`}>
          {getRoleBadgeTitle()}
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-5 flex flex-col items-center text-center bg-radial from-emerald-50/50 via-white to-slate-50">
          {/* Avatar or Photo Placeholder */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-600 shadow-md bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center overflow-hidden">
              <User className="w-14 h-14 text-emerald-700" />
            </div>
            {/* Gender Badge */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-0.5 rounded-full bg-slate-900 text-white shadow-sm border border-slate-700">
              {participant.gender === 'homme' ? 'Frère' : 'Sœur'}
            </span>
          </div>

          {/* Participant Name */}
          <h2 className="text-lg font-black text-slate-900 leading-snug uppercase tracking-tight">
            {participant.fullName}
          </h2>

          {/* Sub-committee */}
          <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200">
            <span>📍</span>
            <span>{participant.subCommittee}</span>
          </div>

          {/* Additional details */}
          <div className="mt-2 text-xs text-slate-600">
            {participant.schoolLevel && (
              <p className="font-semibold text-slate-700">{participant.schoolLevel} • {participant.schoolName}</p>
            )}
            {participant.teachingSubject && (
              <p className="font-bold text-blue-800">Module : {participant.teachingSubject}</p>
            )}
            {participant.commissionRole && (
              <p className="font-bold text-orange-800">{participant.commissionRole}</p>
            )}
          </div>

          {/* Clothing Badge if purchased */}
          {participant.hasPolo && (
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-900 text-[10px] font-extrabold border border-orange-300">
              <span>👕 {participant.clothingType === 'tshirt' ? 'Tee-shirt' : 'Polo'} {participant.poloSize || 'Inclus'}</span>
              {participant.poloColor && <span>({participant.poloColor})</span>}
            </div>
          )}

          {/* QR Code and Matricule */}
          <div className="mt-3.5 p-2.5 bg-white rounded-2xl border-2 border-dashed border-emerald-300 flex items-center justify-between gap-3 w-full shadow-xs">
            <div className="w-20 h-20 bg-emerald-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-emerald-100">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code Matricule" className="w-full h-full object-contain" />
              ) : (
                <QrIcon className="w-10 h-10 text-emerald-600 animate-pulse" />
              )}
            </div>

            <div className="flex-1 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-600 block">Matricule Officiel</span>
              <span className="text-sm font-mono font-black text-emerald-900 tracking-wider block">
                {participant.matricule}
              </span>
              <div className="mt-1 flex items-center gap-1">
                {participant.paymentStatus === 'paye' || participant.paymentStatus === 'gratuit' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                    Paiement Validé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md border border-orange-300">
                    <Clock className="w-3 h-3 text-orange-600" />
                    En attente règlement
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Verification stamp & dates */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-200 w-full flex items-center justify-between text-[10px] text-slate-600">
            <div className="flex items-center gap-1 text-emerald-900 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sceau AEEMCI Gôh</span>
            </div>
            <span className="font-semibold text-slate-700">{config.location.city} • {config.displayDates}</span>
          </div>
        </div>

        {/* Security Barcode Footer */}
        <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-[9px] font-mono">
          <span className="tracking-widest">||| | |||| | || ||| |||||</span>
          <span className="text-slate-400">SERFIG-GOH-OFFICIEL</span>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      {showActions && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimer le Badge
          </button>
          <a
            href={qrCodeUrl}
            download={`badge_${participant.matricule}.png`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Télécharger le QR
          </a>
        </div>
      )}
    </div>
  );
};
