export default {
  path: "/sys",
  meta: {
    title: "系统管理"
  },
  children: [
    {
      path: "/menu",
      name: "SysMenu",
      component: () => import("@/views/sys/menu/index.vue"),
      meta: {
        title: "菜单管理"
      }
    },
    {
      path: "/other",
      name: "SysOther",
      component: () => import("@/views/sys/other/index.vue"),
      meta: {
        title: "其他设置"
      }
    }
  ]
} as RouteConfigsTable;
