import React, { useReducer } from "react";
import storeReducer from "./storeReducer";
import storeContext from "./storeContext";
import decode_token from "../utils";

const StorePovider = ({ children }) => {
  let initialState = {
    userInfo: decode_token(localStorage.getItem("newsToken")),
    token: localStorage.getItem("newsToken") || "",
  };

  const [store, dispatch] = useReducer(storeReducer, initialState);

  return (
    <storeContext.Provider value={{ store, dispatch }}>
      {children}
    </storeContext.Provider>
  );
};

export default StorePovider;
