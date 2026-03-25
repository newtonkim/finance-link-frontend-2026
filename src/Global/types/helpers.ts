
 type MenuItemsRoute={
  path: string;
  label: string; 
  showSideBar?: boolean;

  permissions?: string;
  component: any;
 }
 type MenuRoutesChildren={
  title: string;
  items:MenuItemsRoute[];

 }
export interface MenuRoutes {
  path?: string;
  label?: string;
  showSideBar?: boolean;
  icon?: any; // or a more specific type depending on your icon library
  permissions?: string;
  prifix?: string;
  children?: MenuRoutesChildren[];
  component?: any;

}

