"use client";

// 從 index.ts 一次過引入所有模組
import { ModalReject, ModalFMS, ModalDOCS, ModalRefuelling, ModalSNN, ModalAcceptFuel } from "./modals"; 
import { ModalLoadsheet } from './modals/ModalLoadsheet/index'
import { ModalAirports } from "./modals/ModalAirports/index";

// 🌟 修正：記得喺呢度加返 handlers 入去！
export default function DashboardModals({ flightData, updateFlightData, activeModal, setActiveModal, calc, handlers }: any) {
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
    case 'AcceptFuel': modalTitle = 'Accept Final Fuel Figures'; break;
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-6 md:p-8 backdrop-blur-sm animate-fade-in">
      
      {/* 🌟 全新 Cathay EFB 風格容器：深灰底色 (#1c1c1c)、幼細邊框 (#333)、厚實陰影 */}
      <div className={`bg-[#1c1c1c] border border-[#333333] rounded-2xl w-full ${activeModal === 'Airports' ? 'max-w-7xl' : 'max-w-6xl'} shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[90vh]`}>
        
        {/* 🌟 共用 Header 外殼 (乾淨、沉穩) */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#1c1c1c] border-b border-[#333333] shrink-0">
          <h2 className="text-lg font-bold text-white tracking-wide">{modalTitle}</h2>
          
          {/* iOS 風格的圓形關閉按鈕 */}
          <button 
            onClick={() => setActiveModal(null)} 
            className="text-[#8fa0a6] hover:text-white hover:bg-[#333333] rounded-full w-8 h-8 flex items-center justify-center font-black transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* 🌟 根據 State 注入獨立模組內容 (內容區用更深的黑 #0a0a0a 托底，突顯層次) */}
        <div className={`p-6 overflow-y-auto text-[#e2e8f0] flex-1 ${activeModal !== 'Airports' ? 'font-mono' : 'font-sans'} text-sm leading-relaxed bg-[#0a0a0a]`}>
          
          {activeModal === 'FMS' && <ModalFMS calc={calc} flightData={flightData} />}
          
          {activeModal === 'Loadsheet' && <ModalLoadsheet calc={calc} flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          
          {activeModal === 'RejectPrelim' && <ModalReject type="PRELIM" flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          
          {activeModal === 'RejectFinal' && <ModalReject type="FINAL" flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          
          { activeModal === 'Airports' && <ModalAirports calc={calc} flightData={flightData} /> }
          { activeModal === 'Refuelling' && <ModalRefuelling flightData={flightData} updateFlightData={updateFlightData} setActiveModal={setActiveModal} />}
          { activeModal === 'SNN' && <ModalSNN flightData={flightData} />}
          { activeModal === 'DOCS' && <ModalDOCS flightData={flightData} />}
          {/* 🌟 這裡使用 handlers，上面已經補返接收 */}
          { activeModal === 'AcceptFuel' && <ModalAcceptFuel flightData={flightData} calc={calc} handlers={handlers} setActiveModal={setActiveModal} />}
        </div>
      </div>
    </div>
  );
}