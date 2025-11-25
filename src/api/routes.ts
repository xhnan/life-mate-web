import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { MenuType } from "@/api/type";

// export const getAsyncRoutes = () => {
//   return http.request<Result>("get", "/get-async-routes");
// };
export const getAsyncRoutes = () => {
  return http.request<Array<MenuType>>(
    "get",
    baseUrlApi("/sys/menus/getUserMenus")
  );
};
