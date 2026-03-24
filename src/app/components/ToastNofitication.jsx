import { toast } from "react-toastify";

export const errors = (message) => {
  toast.error(`${message}`, {
    style: {
      background: "white",
      color: "#666666",
      overflow: "hidden",
      position: "relative"
    },
    progressStyle: {
      background: "linear-gradient(90deg, #B20000, #FF1A1A, #FF4D4D, #B20000)"
    }
  });
};

export const warnings = (message) => {
  toast.warn(`${message}`, {
    style: {
      background: "white",
      color: "#666666",
      position: "relative",
      overflow: "hidden"
    },
    progressStyle: {
      background: "linear-gradient(90deg, #FFA500, #FFCC00, #FFA500)"
    }
  });
};

export const success = (message) => {
  toast.success(`${message}`);
};
