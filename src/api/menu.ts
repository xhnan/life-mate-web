// 菜单管理相关接口
import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

// 菜单类型枚举（根据截图：菜单 / iframe / 外链 / 按钮）
export enum MenuTypeEnum {
  MENU = 1,
  IFRAME = 2,
  LINK = 3,
  BUTTON = 4
}

// 单条菜单数据结构（扩展截图中字段）
export interface MenuItem {
  id: number;
  parentId?: number | null;
  name: string; // 菜单名称
  routeName?: string; // 路由名称
  type: MenuTypeEnum;
  path?: string; // 路由路径 或 iframe / 外链地址
  component?: string; // 组件路径
  redirect?: string; // 路由重定向
  perm?: string; // 权限标识（按钮）
  icon?: string; // 菜单图标
  rightIcon?: string; // 右侧图标
  enterTransition?: string; // 进场动画
  leaveTransition?: string; // 离场动画
  activeMenu?: string; // 菜单激活（高亮其他）
  sort?: number; // 排序
  hidden?: boolean; // 是否隐藏自身
  hideParent?: boolean; // 隐藏父级菜单（截图“父级菜单 显示/隐藏”）
  keepAlive?: boolean; // 缓存页面
  affix?: boolean; // 固定标签页
  closable?: boolean; // 标签页是否允许关闭（截图“标签页 允许/禁止”）
  children?: MenuItem[]; // 子节点
}

// 保存菜单提交结构（与 MenuItem 分离，避免 children 干扰）
export interface MenuSavePayload {
  id?: number;
  parentId?: number | null;
  title: string;
  routeName?: string;
  menuName?: string;
  menuType: number;
  routePath?: string;
  component?: string;
  redirect?: string;
  icon?: string;
  rank?: number;
}

const PREFIX = "/api/sys/menus"; // 统一前缀，可按后端实际修改

// 获取菜单树（可带查询参数，比如 name）
export function getMenuList(name): Promise<MenuItem[]> {
  return http.get<MenuItem[], any>(`${PREFIX}/getAllMenus`, {
    params: { name }
  });
}

// 新增或编辑菜单
export function addMenuApi(data: MenuSavePayload): Promise<void> {
  return http.post<void, MenuSavePayload>(`${PREFIX}/addMenus`, { data });
}
// 新增或编辑菜单
export function updateMenuApi(data: MenuSavePayload): Promise<void> {
  return http.post<void, MenuSavePayload>(`${PREFIX}/updateMenus`, { data });
}

// 删除菜单
export function deleteMenu(id: number): Promise<void> {
  return http.post<void, { id: number }>(`${PREFIX}/deleteMenus`, {
    data: { id }
  });
}
