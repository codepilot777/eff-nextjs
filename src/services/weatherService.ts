export const injectMETAR = (sendFn: (payload: any) => void, metarString: string) => {
  sendFn({
    command: "offsets.write",
    name: "weatherPort",
    offsets: [{ name: "metarString", value: metarString }]
  });
  console.log(`⛈️ Weather Injected: ${metarString}`);
};