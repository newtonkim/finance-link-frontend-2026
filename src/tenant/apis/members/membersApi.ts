// import { notify } from '../../Global/Toasters';
import { notify } from '@/Global/Toasters/ToastMsg';
import { pomPinia } from 'septor-store';

export function membersApi() {
    const Store = pomPinia();

    function create(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'createmembers',
            time: 0,
            reqs: {
                url: '/members/create',
                method: 'post',
                data,
            },
        };
        const res: any = Store.stateGenaratorApi(collection);

        let msg: Record<string, string> = {
            msg: 'Failed to create members',
            type: 'Error',
        };
        if (!res || res.status == 200) {
            msg = {
                msg: 'members created successfully',
                type: 'Success',
            };
        }
        notify(msg);
    }
    function fetchPositions(data?: any) {
        const collection: any = {
            reload: 0,
            StateStore: 'fetchPositions',
            time: 0,
            reqs: {
                url: '/members/positions',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }
    function fetchmembers(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'fetchPositions',
            time: 0,
            reqs: {
                url: '/members/list',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }
    function Erase(data: any) {
        const collection: any = {
            reload: 1,
            StateStore: 'fetchPositions',
            time: 0,
            reqs: {
                url: '/members/list',
                method: 'post',
                data,
            },
            mStore: { mUse: true },
        };
        return Store.stateGenaratorApi(collection);
    }

    return {
        create,Erase,
        fetchmembers,
        fetchPositions,
    };
}
