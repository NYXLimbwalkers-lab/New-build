import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { A11yProvider } from "./lib/a11y";
import { SPRING } from "./lib/motionPresets";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/*
      MotionConfig sets the app-wide motion "hand":
      - one default spring so everything moves coherently
      - reducedMotion="user" disables transform/layout anims for users who ask,
        while keeping gentle opacity fades.
    */}
    <MotionConfig reducedMotion="user" transition={SPRING.gentle}>
      <A11yProvider>
        <RouterProvider router={router} />
      </A11yProvider>
    </MotionConfig>
  </StrictMode>,
);
