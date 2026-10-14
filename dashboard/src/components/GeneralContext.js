import React, { useCallback, useState } from "react";
import BuyActionWindow from "./BuyActionWindow";

const GeneralContext = React.createContext({ openOrderWindow: () => {}, closeOrderWindow: () => {}, openBuyWindow: () => {} });

export const GeneralContextProvider = ({ children }) => {
  const [order, setOrder] = useState(null);
  const openOrderWindow = useCallback((uid, mode = "BUY", marketPrice = 0) => setOrder({ uid, mode, marketPrice }), []);
  const closeOrderWindow = useCallback(() => setOrder(null), []);
  const openBuyWindow = useCallback((uid, marketPrice) => openOrderWindow(uid, "BUY", marketPrice), [openOrderWindow]);

  return <GeneralContext.Provider value={{ openOrderWindow, closeOrderWindow, openBuyWindow }}>{children}{order && <BuyActionWindow {...order} />}</GeneralContext.Provider>;
};

export default GeneralContext;
