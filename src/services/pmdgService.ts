export const sendPMDGControl = (sendFn: (payload: any) => void, eventId: number, mouseFlag: number = 536870912) => {
  sendFn({
    command: "offsets.write", name: "controlPort",
    offsets: [{ name: "param", value: mouseFlag }]
  });
  sendFn({
    command: "offsets.write", name: "controlPort",
    offsets: [{ name: "control", value: eventId }]
  });
  console.log(`📡 PMDG Control Sent: Event ${eventId}`);
};

export const fireCDUMacro = async (sendFn: (payload: any) => void, sequence: number[]) => {
  console.log(`👻 Ghost Pilot activating sequence of ${sequence.length} keystrokes...`);
  for (const eventId of sequence) {
    sendPMDGControl(sendFn, eventId);
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  console.log("👻 Ghost Pilot sequence complete!");
};

export const setSimPause = (sendFn: (payload: any) => void, shouldPause: boolean) => {
  sendFn({
    command: "offsets.write", name: "controlPort",
    offsets: [{ name: "directPause", value: shouldPause ? 1 : 0 }]
  });
};