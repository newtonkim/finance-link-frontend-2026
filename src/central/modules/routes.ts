import type { RouteRecordRaw } from 'vue-router'  
import { CreditCard, LayoutGrid, SettingsIcon, Store, Users } from 'lucide-vue-next'
 
export const  centarRoutes:any=[
  {
    path: 'login',
    label:"login",
    component: () => import('./pages/Login.vue'),
  },
  {
    path: 'register',
    label:"register",
    component: () => import('./pages/Register.vue'),
  },
  {
    path: 'Main',
    label:"Main",
    type:"label",
    showSideBar: true
  },
  {
    path: 'dashboard',
    label:"dashboard",
    icon: LayoutGrid,
    component: () => import('./pages/Dashboard.vue'),
    showSideBar: true
  },
  {
    path: 'licenses',
    label:"licenses",
    permissions:"licenses-module-link-view",
    icon: CreditCard,
    showSideBar: true,
    component: () => import('./licenses/Index.vue'),
  },  
  { 
    path: 'platform-users',
    label:"platform-users",
    permissions:"staff-module-link-view",
    icon: Users, 
    showSideBar: true,
    component: () => import('./staff/Index.vue'),
  },
  {
   path: 'tenants',
   icon: Store,
   showSideBar: true,
    permissions:"tenants-module-link-view",

   component: () => import('./tenants/Index.vue'),
   label:"tenants",

 }, 
  { 
    path: 'tenants/:id',  

    component: () => import('./pages/TenantDetail.vue'), 
  },

 {
    label: "Settings",
    icon: SettingsIcon,
    permissions:"settings-module-link-view",
    showSideBar: true,
    prifix:"central",
    children: [
       {
        title: "General",
        items: [
          
          {
            path: "Permission",
            label: "Permission",
            component: () => import('./settings/General/permisions/Index.vue'),
            permissions:"settings-permission-view",

          }, 
          {
            path: "roles",
            label: "roles",
            component: () => import('./settings/General/roles/Index.vue'),
          },
          {
            path: "Plan",
            label: "Plan",
            component: () => import('./settings/General/plans/Index.vue'),
          },
          
        ],
      },
      {
        title: "Notifications",
        items: [
          {
            path: "notifications",
            label: "notifications",
            component: () => import('./settings/PagesTrials/Notifications.vue'),
          },
        ],
      },
      {
        title: "System",
        items: [
          {
            path: "system",
            label: "system",
            component: () => import('./settings/PagesTrials/SystemSettings.vue'),
          },
        ],
      },
     
      
    ]

 }
]

export const centralRoutes: RouteRecordRaw[] = routebuilder(centarRoutes,"central")
console.log(centralRoutes);

function RouteStructure(route:any,routePath:string){
  return ({
  
      name: routePath.replaceAll("/","-"),
  path: `/${routePath}`,
  component: route.component,

})
}
function routebuilder(routes=[],prifix="central",){
  const collecction:any=[];
  routes.forEach(route => {
    if(!route?.children){
      const routePath= `${prifix}/${route.path}`
     collecction.push(RouteStructure(route,routePath))
    }else if(Array.isArray(route.children)){
      route.children.forEach(child => {
         if(child?.items){ 
           child.items.forEach(item => {
             const childRoutePath= `${prifix}/${item.path}`
             console.log(childRoutePath);
             
     collecction.push(RouteStructure(item,childRoutePath))

           })
         }
      })
    }
    
  });
  return collecction

}

// prifix/title/path

