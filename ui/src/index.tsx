import React, { useState } from "react";
import ReactDOM from "react-dom";
import CssBaseline from '@mui/material/CssBaseline'
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme'
import { App } from "./App";

export const MyContext = React.createContext(null);

const ThemeProvider = (props) => {
  const [store, setStore] = useState({
    pipelines: []
  });

  const [actions, setActions] = useState({
    setPipelineName: (value) => {
      setStore({
        pipelines: value,
      });
    }
  });

  return (
    <MyContext.Provider value={{ actions, store }}>
      {props.children}
    </MyContext.Provider>
  );
};

ReactDOM.render(
  <React.StrictMode>
    {/*
      If you eject from MUI (which we don't recommend!), you should add
      the `dockerDesktopTheme` class to your root <html> element to get
      some minimal Docker theming.
    */}
    <DockerMuiThemeProvider>
      <CssBaseline />
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </DockerMuiThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
