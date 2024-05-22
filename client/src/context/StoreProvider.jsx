import React, { useReducer } from "react";
import storeReducer from "./storeReducer";
import storeContext from "./storeContext";

const StorePovider = ({ children }) => {
  let initialState = {
    userInfo: "",
    token: "",
  };

  const [store, dispatch] = useReducer(storeReducer, initialState);

  return (
    <storeContext.Provider value={{ store, dispatch }}>
      {children}
    </storeContext.Provider>
  );
};

export default StorePovider;
