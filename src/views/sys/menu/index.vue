<template>
  <div class="sys-menu-page">
    <!-- 顶部卡片：搜索与操作 -->
    <el-card shadow="never" class="top-card">
      <el-form :inline="true" :model="query" class="search-form">
        <!-- 恢复“菜单名称”搜索栏，与按钮同一行 -->
        <el-form-item label="菜单名称">
          <el-input
            v-model="query.name"
            placeholder="请输入菜单名称"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch"
            >搜索</el-button
          >
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="loading" @click="openAddRoot"
            >新增菜单</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 底部卡片：菜单表格展示 -->
    <el-card shadow="never" class="bottom-card">
      <el-table
        v-loading="loading"
        :data="menuTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        class="menu-table"
        border
      >
        <!-- 移除 type="expand" 的明细展开列，避免与树形展开冲突 -->
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column label="菜单类型" min-width="90">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{
              getTypeLabel(row.type)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" min-width="140" />
        <el-table-column prop="component" label="组件路径" min-width="180" />
        <el-table-column prop="perm" label="权限标识" min-width="140" />
        <el-table-column prop="routeName" label="路由名称" min-width="120" />
        <el-table-column prop="icon" label="图标" min-width="120">
          <template #default="{ row }">
            <span>{{ row.icon || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column label="隐藏" width="70">
          <template #default="{ row }">
            <el-icon v-if="row.hidden" color="var(--el-color-danger)">
              <circle-close />
            </el-icon>
            <el-icon v-else color="var(--el-color-success)">
              <circle-check />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">修改</el-button>
            <el-button
              link
              type="primary"
              :disabled="row.type === MenuTypeEnum.BUTTON"
              @click="openAddChild(row)"
              >新增</el-button
            >
            <el-popconfirm title="确认删除该菜单?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 挂载一次对话框组件 -->
    <MenuForm ref="menuFormRef" />
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import MenuForm from "./components/MenuForm.vue";
import {
  getMenuList,
  deleteMenu,
  MenuTypeEnum,
  type MenuItem
} from "@/api/menu";
import { CircleCheck, CircleClose } from "@element-plus/icons-vue";

defineOptions({ name: "SysMenu" });

const loading = ref(false);
const query = reactive<{ name: string }>({ name: "" });
const menuTree = ref<MenuItem[]>([]);
const menuFormRef = ref<any>();

function fetchData() {
  loading.value = true;
  getMenuList(query.name || undefined)
    .then(list => {
      menuTree.value = buildTree(list);
    })
    .finally(() => (loading.value = false));
}

function handleSearch() {
  fetchData();
}
function handleReset() {
  query.name = "";
  fetchData();
}

function openAddRoot() {
  menuFormRef.value
    ?.open({
      title: "新增根菜单",
      mode: "add",
      parentId: null,
      allMenus: flatFromTree(menuTree.value)
    })
    .then(ok => ok && fetchData());
}
function openAddChild(row: MenuItem) {
  menuFormRef.value
    ?.open({
      title: `新增子菜单 - ${row.name}`,
      mode: "add",
      parentId: row.id,
      allMenus: flatFromTree(menuTree.value)
    })
    .then(ok => ok && fetchData());
}
function openEdit(row: MenuItem) {
  menuFormRef.value
    ?.open({
      title: `编辑菜单 - ${row.name}`,
      mode: "edit",
      parentId: row.parentId ?? null,
      initialData: row,
      allMenus: flatFromTree(menuTree.value)
    })
    .then(ok => ok && fetchData());
}

function flatFromTree(list: MenuItem[]): MenuItem[] {
  const res: MenuItem[] = [];
  const walk = (nodes: MenuItem[]) => {
    nodes.forEach(n => {
      res.push(n);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(list);
  return res;
}

function handleDelete(row: MenuItem) {
  deleteMenu(row.id).then(() => {
    ElMessage.success("删除成功");
    fetchData();
  });
}

function getTypeLabel(type: MenuTypeEnum) {
  switch (type) {
    case MenuTypeEnum.MENU:
      return "菜单";
    case MenuTypeEnum.IFRAME:
      return "iframe";
    case MenuTypeEnum.LINK:
      return "外链";
    case MenuTypeEnum.BUTTON:
      return "按钮";
    default:
      return String(type);
  }
}
function getTypeTagType(type: MenuTypeEnum) {
  switch (type) {
    case MenuTypeEnum.MENU:
      return "primary";
    case MenuTypeEnum.IFRAME:
      return "warning";
    case MenuTypeEnum.LINK:
      return "danger"; // 更醒目的外链标识
    case MenuTypeEnum.BUTTON:
      return "success";
    default:
      return "info";
  }
}

function buildTree(list: MenuItem[]): MenuItem[] {
  if (!Array.isArray(list)) return [];

  const normalizeId = (val: any) =>
    typeof val === "string" ? Number(val) : (val as number);

  // 如果后端已返回树结构（存在任意 children），仅做归一化与排序
  const hasTree = list.some(
    (n: any) => Array.isArray(n?.children) && n.children.length > 0
  );
  if (hasTree) {
    const clone = (nodes: any[]): any[] =>
      nodes.map(n => ({
        ...n,
        id: normalizeId(n.id),
        parentId:
          n.parentId === undefined || n.parentId === null
            ? n.parentId
            : normalizeId(n.parentId),
        children: Array.isArray(n.children) ? clone(n.children) : []
      }));
    const roots = clone(list);
    const sortFn = (a: MenuItem, b: MenuItem) => (a.sort || 0) - (b.sort || 0);
    const sortTree = (nodes: MenuItem[]) => {
      nodes.sort(sortFn);
      nodes.forEach(
        (n: MenuItem) => n.children && n.children.length && sortTree(n.children)
      );
    };
    sortTree(roots);
    return roots;
  }

  // 否则：按扁平数据构建树
  const map = new Map<number, MenuItem>();
  (list as any[]).forEach(raw => {
    const nid = normalizeId(raw.id);
    map.set(nid, { ...(raw as any), id: nid, children: [] });
  });
  const roots: MenuItem[] = [];
  map.forEach(item => {
    const pid = ((): number | null | undefined => {
      const v = (item as any).parentId;
      if (v === null || v === undefined || v === 0 || v === "0") return 0;
      return normalizeId(v);
    })();
    if (pid && pid !== 0) {
      const parent = map.get(pid as number);
      parent ? parent.children!.push(item) : roots.push(item);
    } else {
      roots.push(item);
    }
  });
  const sortFn = (a: MenuItem, b: MenuItem) => (a.sort || 0) - (b.sort || 0);
  const sortTree = (nodes: MenuItem[]) => {
    nodes.sort(sortFn);
    nodes.forEach(
      (n: MenuItem) => n.children && n.children.length && sortTree(n.children)
    );
  };
  sortTree(roots);
  return roots;
}

onMounted(fetchData);
</script>
<style scoped lang="scss">
.sys-menu-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}
.top-card,
.bottom-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}
.top-card {
  .search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 0;
    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}
.menu-table {
  width: 100%;
}
.expand-box {
  font-size: 12px;
  line-height: 20px;
}
</style>
