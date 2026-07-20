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
    path: "/plans",
    component: () => import("../pages/AiPlans.vue")
  },

  // ⭐ 新增 AI 连续对话
  {
    path: "/aichat",
    component: () => import("../pages/AIChat.vue")
  },

  {
    path: "/auth",
    component: () => import("../pages/Auth.vue")
  },

  {
    path: "/settings",
    component: () => import("../pages/Settings.vue")
  },

  // 404
  {
    path: "/:pathMatch(.*)*",
    redirect: "/"
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router