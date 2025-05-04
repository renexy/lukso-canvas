
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { UpProvider } from "./lukso/UPProvider.tsx";
import  { Toaster } from 'react-hot-toast';

createRoot(document.getElementById("root")!).render(
  <UpProvider>
      <Toaster />
    <App />
  </UpProvider>
);
