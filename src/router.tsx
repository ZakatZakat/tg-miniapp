// src/router.tsx
import { createRootRoute, createRouter, createRoute } from "@tanstack/react-router"
import App from "./App"
import Landing from "./pages/Landing"
import Feed from "./pages/Feed"
import About from "./pages/About"

const rootRoute = createRootRoute({ component: App })
const landingRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Landing })
const feedRoute = createRoute({ getParentRoute: () => rootRoute, path: "/feed", component: Feed })
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: "/about", component: About })

const routeTree = rootRoute.addChildren([landingRoute, feedRoute, aboutRoute])
export const router = createRouter({ routeTree })
declare module "@tanstack/react-router" { interface Register { router: typeof router } }
