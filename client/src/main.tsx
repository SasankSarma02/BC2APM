import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Material icons
const link = document.createElement('link');
link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
link.rel = "stylesheet";
document.head.appendChild(link);

// Google fonts
const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Mono:wght@400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// Set title
document.title = "BC Migration Accelerator";

createRoot(document.getElementById("root")!).render(<App />);
