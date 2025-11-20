<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="!isExpanded && (isHovered = true)"
    @mouseleave="isHovered = false"
  >
    <div
      :class="[
        'py-8 flex',
        !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start',
      ]"
    >
      <router-link to="/">
        <img
          v-if="isExpanded || isHovered || isMobileOpen"
          src="/images/logo/AmSpec-logo.png"
          alt="AmSpec Logo"
          width="150"
          height="40"
          class="object-contain"
        />
        <img
          v-else
          src="/images/logo/AmSpec-logo.png"
          alt="AmSpec Logo"
          width="50"
          height="50"
          class="object-contain"
        />
      </router-link>
    </div>
    <div
      class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar"
    >
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in menuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !isExpanded && !isHovered
                  ? 'lg:justify-center'
                  : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <HorizontalDots v-else />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.name">
                <button
                  v-if="item.subItems"
                  @click="toggleSubmenu(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      'menu-item-active': isSubmenuOpen(groupIndex, index),
                      'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                    },
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isSubmenuOpen(groupIndex, index)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                  <ChevronDownIcon
                    v-if="isExpanded || isHovered || isMobileOpen"
                    :class="[
                      'ml-auto w-5 h-5 transition-transform duration-200',
                      {
                        'rotate-180 text-brand-500': isSubmenuOpen(
                          groupIndex,
                          index
                        ),
                      },
                    ]"
                  />
                </button>
                <router-link
                  v-else-if="item.path"
                  :to="item.path"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                </router-link>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="
                      isSubmenuOpen(groupIndex, index) &&
                      (isExpanded || isHovered || isMobileOpen)
                    "
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.name">
                        <router-link
                          :to="subItem.path"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isActive(
                                subItem.path
                              ),
                              'menu-dropdown-item-inactive': !isActive(
                                subItem.path
                              ),
                            },
                          ]"
                        >
                          {{ subItem.name }}
                          <span class="flex items-center gap-1 ml-auto">
                            <span
                              v-if="subItem.new"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              new
                            </span>
                            <span
                              v-if="subItem.pro"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              pro
                            </span>
                          </span>
                        </router-link>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, type Component } from "vue";
import { useRoute } from "vue-router";

import {
  ChevronDownIcon,
  HorizontalDots,
} from "../../icons";
import { Ship, LayoutDashboard, Users } from 'lucide-vue-next';
import { useSidebar } from "@/composables/useSidebar";
import { usePermissions } from "@/composables/usePermissions";

const route = useRoute();

const { isExpanded, isMobileOpen, isHovered, openSubmenu } = useSidebar();
const { canAccessMenu, loadUserRole } = usePermissions();

// Load user role on mount
onMounted(async () => {
  await loadUserRole();
});

// Define types for menu items
interface SubMenuItem {
  name: string
  path: string
  permission?: string
  pro?: boolean
  new?: boolean
}

interface MenuItem {
  icon?: Component
  name: string
  path?: string
  permission?: string
  subItems?: SubMenuItem[]
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const allMenuGroups: MenuGroup[] = [
  {
    title: "Menu",
    items: [
      {
        icon: LayoutDashboard,
        name: "Dashboard",
        path: "/",
        permission: "menu.dashboard",
      },
      /*
      {
        icon: Calendar,
        name: "Calendar",
        path: "/calendar",
        permission: "menu.calendar",
      },
      */
      {
        name: "Operations",
        icon: Ship,
        permission: "menu.operations",
        subItems: [
          { name: "Ship Nomination", path: "/ship-nomination", permission: "menu.operations.ship-nomination", pro: false },
          { name: "Sampling Roster", path: "/sampling-roster", permission: "menu.operations.sampling-roster", pro: false },
          { name: "Molekulis Loading", path: "/molekulis-loading", permission: "menu.operations.molekulis-loading", pro: false },
          { name: "Other Jobs", path: "/other-jobs", permission: "menu.operations.other-jobs", pro: false },
        ],
      },
      {
        name: "Users",
        icon: Users,
        permission: "menu.users",
        subItems: [
          { name: "Management Users", path: "/management-users", permission: "menu.users.management-users", pro: false },
        ],
      },
    ],
  },
];

// Filter menu items based on permissions
const menuGroups = computed(() => {
  return allMenuGroups.map(group => ({
    ...group,
    items: group.items
      .map(item => {
        // Check if user has permission for this menu item
        if (item.permission && !canAccessMenu(item.permission)) {
          return null;
        }
        
        // Filter subItems if they exist
        if (item.subItems) {
          const filteredSubItems = item.subItems.filter(subItem => {
            if (subItem.permission) {
              return canAccessMenu(subItem.permission);
            }
            return true;
          });
          
          // If no subItems remain, hide the parent menu
          if (filteredSubItems.length === 0) {
            return null;
          }
          
          return {
            ...item,
            subItems: filteredSubItems,
          };
        }
        
        return item;
      })
      .filter(item => item !== null),
  })).filter(group => group.items.length > 0);
});

const isActive = (path: string) => route.path === path;

const toggleSubmenu = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

const isAnySubmenuRouteActive = computed(() => {
  const groups = menuGroups.value;
  if (!Array.isArray(groups)) return false;
  return groups.some((group) =>
    group.items.some(
      (item) =>
        item.subItems && item.subItems.some((subItem) => isActive(subItem.path))
    )
  );
});

const isSubmenuOpen = (groupIndex: number, itemIndex: number) => {
  const key = `${groupIndex}-${itemIndex}`;
  const groups = menuGroups.value;
  if (!Array.isArray(groups) || !groups[groupIndex]) return false;
  
  return (
    openSubmenu.value === key ||
    (isAnySubmenuRouteActive.value &&
      groups[groupIndex].items[itemIndex]?.subItems?.some((subItem) =>
        isActive(subItem.path)
      ))
  );
};

const startTransition = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = "auto";
  const height = element.scrollHeight;
  element.style.height = "0px";
  void element.offsetHeight; // force reflow
  element.style.height = height + "px";
};

const endTransition = (el: Element) => {
  (el as HTMLElement).style.height = "";
};
</script>
