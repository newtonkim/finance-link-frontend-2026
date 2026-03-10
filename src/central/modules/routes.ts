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
    icon: CreditCard,
    showSideBar: true,
    component: () => import('./licenses/Index.vue'),
  },  
  { 
    path: 'platform-users',
    label:"platform-users",
    icon: Users, 
    showSideBar: true,
    component: () => import('./staff/Index.vue'),
  },
  {
   path: 'tenants',
   icon: Store,
   showSideBar: true,
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
    showSideBar: true,
    children: [
       {
        title: "General",
        items: [
          
          {
            path: "settings",
            label: "settings",
            component: () => import('./settings/PagesTrials/GeneralSettings.vue'),
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

function RouteStructure(route:any,routePath:string){
  return ({
  
      name: routePath.replaceAll("/","-"),
  path: `/${routePath}`,
  component: route.component,
})
}
function routebuilder(routes=[],prifex="central",){
  const collecction:any=[];
  routes.forEach(route => {
    if(!route?.children){
      const routePath= `${prifex}/${route.path}`
     collecction.push(RouteStructure(route,routePath))
    }else if(Array.isArray(route.children)){
      route.children.forEach(child => {
         if(child?.items){
            const ltb= `${prifex}/${child.title}`
           child.items.forEach(item => {
             const childRoutePath= `${ltb}/${item.path}`
             console.log(childRoutePath);
             
     collecction.push(RouteStructure(route,childRoutePath))

           })
         }
      })
    }
    
  });
  return collecction

}


