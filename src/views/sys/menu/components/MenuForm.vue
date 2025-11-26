<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="900px"
    align-center
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      class="menu-form form-grid"
    >
      <!-- 菜单类型：整行 -->
      <el-form-item prop="type" label="菜单类型" class="full-row">
        <el-segmented v-model="form.type" :options="typeOptions" />
      </el-form-item>

      <!-- 上级菜单：新增时整行 -->
      <el-form-item v-if="mode === 'add'" label="上级菜单" class="full-row">
        <el-select
          v-model="form.parentId"
          placeholder="请选择上级菜单"
          clearable
          filterable
        >
          <el-option :value="null" label="(根级)" />
          <el-option
            v-for="m in flatMenu"
            :key="m.id"
            :value="m.id"
            :label="m.name"
          />
        </el-select>
      </el-form-item>

      <!-- 一行两个：名称 / 路由名称 -->
      <el-form-item prop="name" label="菜单名称">
        <el-input v-model="form.name" placeholder="menus.xx" />
      </el-form-item>
      <el-form-item
        v-if="form.type !== MenuTypeEnum.BUTTON"
        prop="routeName"
        label="路由名称"
      >
        <el-input v-model="form.routeName" placeholder="RouteName" />
      </el-form-item>

      <!-- 一行两个：路由路径 / 组件路径（组件仅菜单显示） -->
      <el-form-item
        v-if="form.type !== MenuTypeEnum.BUTTON"
        prop="path"
        label="路由路径"
      >
        <el-input v-model="form.path" placeholder="/path 或 iframe/link 地址" />
      </el-form-item>
      <el-form-item
        v-if="form.type === MenuTypeEnum.MENU"
        prop="component"
        label="组件路径"
      >
        <el-input v-model="form.component" placeholder="views/demo/index" />
      </el-form-item>

      <!-- 一行两个：排序 / 路由重定向（仅菜单显示） -->
      <el-form-item prop="sort" label="菜单排序">
        <el-input-number v-model="form.sort" :min="0" />
      </el-form-item>
      <el-form-item
        v-if="form.type === MenuTypeEnum.MENU"
        prop="redirect"
        label="路由重定向"
      >
        <el-input v-model="form.redirect" placeholder="/xxx" />
      </el-form-item>

      <!-- 一行两个：图标 / 右侧图标（非按钮显示） -->
      <el-form-item
        v-if="form.type !== MenuTypeEnum.BUTTON"
        prop="icon"
        label="菜单图标"
      >
        <el-input v-model="form.icon" placeholder="ri:links-fill" />
      </el-form-item>
      <el-form-item
        v-if="form.type !== MenuTypeEnum.BUTTON"
        prop="rightIcon"
        label="右侧图标"
      >
        <el-input v-model="form.rightIcon" placeholder="自定义右侧图标" />
      </el-form-item>

      <!-- 一行两个：进场动画 / 离场动画（仅菜单显示） -->
      <el-form-item
        v-if="form.type === MenuTypeEnum.MENU"
        prop="enterTransition"
        label="进场动画"
      >
        <el-select
          v-model="form.enterTransition"
          placeholder="请选择进场动画"
          clearable
        >
          <el-option
            v-for="a in transitionOptions"
            :key="a"
            :label="a"
            :value="a"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="form.type === MenuTypeEnum.MENU"
        prop="leaveTransition"
        label="离场动画"
      >
        <el-select
          v-model="form.leaveTransition"
          placeholder="请选择离场动画"
          clearable
        >
          <el-option
            v-for="a in transitionOptions"
            :key="a"
            :label="a"
            :value="a"
          />
        </el-select>
      </el-form-item>

      <!-- 一行两个：菜单激活 / 菜单显示隐藏（非按钮显示） -->
      <el-form-item
        v-if="form.type !== MenuTypeEnum.BUTTON"
        prop="activeMenu"
        label="菜单激活"
      >
        <el-input v-model="form.activeMenu" placeholder="输入需要激活的菜单" />
      </el-form-item>
      <el-form-item v-if="form.type !== MenuTypeEnum.BUTTON" label="菜单">
        <el-segmented
          v-model="form.hidden"
          :options="hiddenOptions"
        />
      </el-form-item>

      <!-- 一行两个：父级菜单显示隐藏 / 缓存页面（仅菜单显示缓存） -->
      <el-form-item v-if="form.type !== MenuTypeEnum.BUTTON" label="父级菜单">
        <el-segmented
          v-model="form.hideParent"
          :options="hideParentOptions"
        />
      </el-form-item>
      <el-form-item v-if="form.type === MenuTypeEnum.MENU" label="缓存页面">
        <el-segmented
          v-model="form.keepAlive"
          :options="keepAliveOptions"
        />
      </el-form-item>

      <!-- 一行两个：固定标签 / 标签页可关闭（仅菜单显示） -->
      <el-form-item v-if="form.type === MenuTypeEnum.MENU" label="固定标签">
        <el-segmented
          v-model="form.affix"
          :options="affixOptions"
        />
      </el-form-item>
      <el-form-item v-if="form.type === MenuTypeEnum.MENU" label="标签页">
        <el-segmented
          v-model="form.closable"
          :options="closableOptions"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import { ElForm, ElMessage } from "element-plus";
import {
  MenuTypeEnum,
  type MenuItem,
  addMenuApi,
  updateMenuApi
} from "@/api/menu";

// 新的保存类型（按用户要求）
interface MenuSavePayloadNew {
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

interface Props {
  mode?: "add" | "edit";
  parentId?: number | null;
  parentName?: string;
  initialData?: MenuItem | null;
  allMenus?: MenuItem[];
}

const props = defineProps<Props>();

const visible = ref(false);
const dialogTitle = ref("");

// 用于 open() 传入的上下文
const context = reactive<{ mode: "add" | "edit"; allMenus: MenuItem[] | undefined }>({
  mode: "add",
  allMenus: undefined
});

// 公开的 open(options) 方法
function open(options: {
  title: string;
  mode: "add" | "edit";
  parentId?: number | null;
  parentName?: string;
  initialData?: MenuItem | null;
  allMenus?: MenuItem[];
}): Promise<boolean> {
  dialogTitle.value = options.title;
  context.mode = options.mode;
  form.parentId = options.parentId ?? null;
  // 供上级选择
  flatMenuSource.value = options.allMenus || [];
  // 初始数据
  if (options.initialData) {
    Object.assign(form, {
      id: options.initialData.id,
      parentId: options.initialData.parentId ?? null,
      name: options.initialData.name,
      routeName: options.initialData.routeName || "",
      type: options.initialData.type,
      path: options.initialData.path || "",
      component: options.initialData.component || "",
      redirect: options.initialData.redirect || "",
      perm: options.initialData.perm || "",
      icon: options.initialData.icon || "",
      rightIcon: options.initialData.rightIcon || "",
      enterTransition: options.initialData.enterTransition || "",
      leaveTransition: options.initialData.leaveTransition || "",
      activeMenu: options.initialData.activeMenu || "",
      sort: options.initialData.sort || 0,
      hidden: !!options.initialData.hidden,
      hideParent: !!options.initialData.hideParent,
      keepAlive: options.initialData.keepAlive !== false,
      affix: !!options.initialData.affix,
      closable: options.initialData.closable !== false
    });
  } else {
    resetForm();
    form.parentId = options.parentId ?? null;
  }
  pendingResolve = null;
  visible.value = true;
  return new Promise(resolve => {
    pendingResolve = resolve;
  });
}

let pendingResolve: ((ok: boolean) => void) | null = null;

function handleCancel() {
  visible.value = false;
  pendingResolve?.(false);
}
async function handleConfirm() {
  const ok = await validateAndSubmit();
  if (ok) {
    visible.value = false;
    pendingResolve?.(true);
  }
}

// 原有表单与校验
const formRef = ref<InstanceType<typeof ElForm>>();
const form = reactive({
  id: undefined as number | undefined,
  parentId: null as number | null,
  name: "",
  routeName: "",
  type: MenuTypeEnum.MENU as number,
  path: "",
  component: "",
  redirect: "",
  perm: "",
  icon: "",
  rightIcon: "",
  enterTransition: "",
  leaveTransition: "",
  activeMenu: "",
  sort: 0,
  hidden: false,
  hideParent: false,
  keepAlive: true,
  affix: false,
  closable: true
});

function resetForm() {
  Object.assign(form, {
    id: undefined,
    name: "",
    routeName: "",
    type: MenuTypeEnum.MENU,
    path: "",
    component: "",
    redirect: "",
    perm: "",
    icon: "",
    rightIcon: "",
    enterTransition: "",
    leaveTransition: "",
    activeMenu: "",
    sort: 0,
    hidden: false,
    hideParent: false,
    keepAlive: true,
    affix: false,
    closable: true
  });
}

const rules = {
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }]
};

// 上级菜单选项来源
const flatMenuSource = ref<MenuItem[]>([]);
const flatMenu = computed(() => flatMenuSource.value);

const typeOptions = [
  { label: "菜单", value: MenuTypeEnum.MENU },
  { label: "iframe", value: MenuTypeEnum.IFRAME },
  { label: "外链", value: MenuTypeEnum.LINK },
  { label: "按钮", value: MenuTypeEnum.BUTTON }
];
const hiddenOptions = [
  { label: "显示", value: false },
  { label: "隐藏", value: true }
];
const hideParentOptions = [
  { label: "显示", value: false },
  { label: "隐藏", value: true }
];
const keepAliveOptions = [
  { label: "缓存", value: true },
  { label: "不缓存", value: false }
];
const affixOptions = [
  { label: "固定", value: true },
  { label: "不固定", value: false }
];
const closableOptions = [
  { label: "允许", value: true },
  { label: "禁止", value: false }
];
const transitionOptions = [
  "fade",
  "scale",
  "slide-left",
  "slide-right",
  "zoom-in",
  "zoom-out"
];

function normalizeByType() {
  // 保持原有清理逻辑，仅影响本地表单
  if (form.type === MenuTypeEnum.BUTTON) {
    form.component = "";
    form.redirect = "";
    form.icon = "";
    form.rightIcon = "";
    form.enterTransition = "";
    form.leaveTransition = "";
    form.activeMenu = "";
    form.keepAlive = false;
    form.affix = false;
  } else if (
    form.type === MenuTypeEnum.IFRAME ||
    form.type === MenuTypeEnum.LINK
  ) {
    form.component = "";
    form.redirect = "";
    form.keepAlive = false;
  } else if (form.type === MenuTypeEnum.MENU) {
    form.perm = "";
  }
}

function toNewPayload(): MenuSavePayloadNew {
  // 字段映射到新的保存类型
  return {
    id: form.id,
    parentId: form.parentId ?? null,
    title: form.name, // 用菜单名称作为标题
    routeName: form.routeName || undefined,
    menuName: form.routeName || form.name, // 没有单独输入时回退为菜单名称
    menuType: Number(form.type),
    routePath: form.path || undefined,
    component: form.component || undefined,
    redirect: form.redirect || undefined,
    icon: form.icon || undefined,
    rank: typeof form.sort === "number" ? form.sort : Number(form.sort) || 0
  };
}

function validateAndSubmit() {
  return formRef.value
    ?.validate()
    .then(async () => {
      normalizeByType();
      const payload = toNewPayload();
      if (context.mode === "edit" && payload.id) {
        await updateMenuApi(payload as any);
      } else {
        await addMenuApi(payload as any);
      }
      ElMessage.success("保存成功");
      return true;
    })
    .catch(() => false);
}

defineExpose({ open });
</script>

<style scoped lang="scss">
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 12px;

  /* 让每个控件占满单元格宽度 */
  :deep(.el-input),
  :deep(.el-input-number),
  :deep(.el-select),
  :deep(.el-segmented) {
    width: 100%;
  }

  /* 清除默认的 Form Item 底部间距，统一用网格间距 */
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  /* 需要整行的项 */
  :deep(.full-row) {
    grid-column: 1 / -1;
  }
}

/* 小屏改为单列显示 */
@media (max-width: 960px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
