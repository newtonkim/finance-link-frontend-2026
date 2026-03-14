import { formDataFormat, scopeValues } from '@/Global';
import { notify } from '@/Global/Toasters';
import { pomPinia } from 'septor-store';

export function rolesPermissions() {
    const Store = pomPinia();
    function feedback(collection:any,success:string,fail:string) {
             const res: any = Store.stateGenaratorApi(collection);
        let msg: Record<string, string> = {
            msg:success ,
            type: 'Error',
        };
        if (!res || res.status == 200) {
            msg = {
                msg: fail,
                type: 'Success',
            };
        }
        notify(msg);
        return res
    }

    function create(data: any) {
      const formDataScoping:any=  formDataFormat(scopeValues(data));
        const collection: any = {
            reload: 1,
            StateStore: 'roles_list',
            time: 0,
            reqs: {
                url: '/tenant/settings/roles/create',
                method: 'post',
                data:formDataScoping,
            },
        };
        feedback(collection,"roles created successfully","Failed to create roles")
    }
  
    
    function EraseRolesFromUser(data: any) {
        // central/settings/roles/list
        const collection: any = {
            reload: 1,
            StateStore: 'staff-attached-roles',
            time: 0,
            reqs: {
                url: '/tenant/settings/roles/remove_ability',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
              return feedback(collection,"Roles removed"," Failed to remove Roles")
    }
     function AttachRolesToUser(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'staff-attached-roles',
            time: 0,
            reqs: {
                url: '/tenant/settings/roles/add_ability',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
             return feedback(collection," Roles attached "," Failed to attach Roles")

    }
   

    return {
        create, EraseRolesFromUser,AttachRolesToUser
    };
}
