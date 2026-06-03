"use client";

// 從 index.ts 一次過引入所有模組
import { ModalLoadsheet, ModalReject, ModalFMS, ModalAirports, ModalDOCS, ModalRefuelling, ModalSNN } from "./modals"; 
// (記得加返 ModalAirports, ModalRefuelling 等等)

export default function DashboardModals({ flightData, updateFlightData, activeModal, setActiveModal, calc }: any) {
  if (!activeModal) return null;

  // 判定 Modal Title
  let modalTitle = "";
  switch(activeModal) {
    case 'FMS': modalTitle = 'FMS & ATS Data Preview'; break;
    case 'Loadsheet': modalTitle = 'Loadsheet & Payload Detail'; break;
    case 'RejectPrelim': modalTitle = 'Reject PRELIM Loadsheet'; break;
    case 'RejectFinal': modalTitle = 'Reject FINAL Loadsheet'; break;
    case 'Airports': modalTitle = 'Airports'; break;
    case 'Refuelling': modalTitle = 'Refuelling Order & Receipt'; break;
    case 'SNN': modalTitle = 'Special Navigation Note'; break;
    case 'DOCS': modalTitle = 'Operational Flight Plan'; break;
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-md animate-fade-in">
      <div className={`bg-lido-800 border border-[#00bfa5] rounded-xl w-full ${activeModal === 'Airports' ? 'max-w-7xl' : 'max-w-6xl'} shadow-[0_0_40px_rgba(0,191,165,0.2)] flex flex-col overflow-hidden max-h-[90vh]`}>
        
        {/* 🌟 共用 Header 外殼 */}
        <div className="flex justify-between items-center p-4 bg-lido-800 border-b border-[#333333] shrink-0">
          <h2 className="text-lg font-black text-status-teal tracking-widest uppercase">{modalTitle}</h2>
          <button onClick={() => setActiveModal(null)} className="text-text-muted hover:text-white font-black text-xl px-2 transition-colors">✕</button>
        </div>
        
        {/* 🌟 根據 State 注入獨立模組內容 */}
        <div className={`p-6 overflow-y-auto text-text-main flex-1 ${activeModal !== 'Airports' ? 'font-mono' : 'font-sans'} text-sm leading-relaxed bg-[#0a0a0a]`}>
          
          {activeModal === 'FMS' && <ModalFMS calc={calc} flightData={flightData} />}
          
          {activeModal === 'Loadsheet' && <ModalLoadsheet calc={calc} flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          
          {activeModal === 'RejectPrelim' && <ModalReject type="PRELIM" flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          
          {activeModal === 'RejectFinal' && <ModalReject type="FINAL" flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          
          {/* 其他 Modal 照寫入去... 例如: */}
          { activeModal === 'Airports' && <ModalAirports calc={calc} flightData={flightData} /> }
          { activeModal === 'Refuelling' && <ModalRefuelling flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          { activeModal === 'SNN' && <ModalSNN flightData={flightData} />}
          { activeModal === 'DOCS' && <ModalDOCS flightData={flightData} />}
        </div>
      </div>
    </div>
  );
}