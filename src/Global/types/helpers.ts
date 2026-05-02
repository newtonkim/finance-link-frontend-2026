import type { Component } from 'vue'

 export type MenuItemsRoute={
  path: string;
  label: string; 
  showSideBar?: boolean;
  icon?: Component;

  permissions?: string;
  component: Component | (() => Promise<Component>);
 }
 export interface MenuRoutesChildren {
  title: string;
  titleStyle?: string;
  items:MenuItemsRoute[];
  permissions?: string;
 }
export interface MenuRoutes {
  type?: string;
  path?: string;
  label?: string;
  showSideBar?: boolean;
  icon?: Component;
  permissions?: string;
  prifix?: string;
  children?: MenuRoutesChildren[];
  component?: Component | (() => Promise<Component>);
  group?: string;
}

