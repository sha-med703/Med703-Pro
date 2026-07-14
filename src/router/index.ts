import { createRouter, createWebHistory } from "vue-router"

const routes = [
  {
    path: "/",
    component: () => import("../pages/Dashboard.vue")
  },
  {
    path: "/study",
    component: () => import("../pages/Study.vue")
  },
  {
    path: "/review",
    component: () => import("../pages/Review.vue")
  },
  {
    path: "/report",
    component: () => import("../pages/Report.vue")
  },
  {
    path: "/coach",
    component: () => import("../pages/Coach.vue")
  },
  {
    path: "/auth",
    component: () => import("../pages/Auth.vue")
  },
  {
    path: "/settings",
    component: () => import("../pages/Settings.vue")
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router