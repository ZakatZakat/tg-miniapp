// src/router.tsx
import { createRootRoute, createRouter, createRoute } from "@tanstack/react-router"
import App from "./App"
import Home from "./pages/Home"
import About from "./pages/About"

const rootRoute = createRootRoute({ component: App })
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: "/about", component: About })

const routeTree = rootRoute.addChildren([homeRoute, aboutRoute])
export const router = createRouter({ routeTree })
declare module "@tanstack/react-router" { interface Register { router: typeof router } }
