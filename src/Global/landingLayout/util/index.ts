
import { dateTime, date } from '../../Helpers';
import { Eye, Edit, Trash, UserCircle2 } from 'lucide-vue-next';

export const dataFomater = (data: any, type: 'date' | 'dateTime') => {
    const filter = {
        date: () => date(data),
        dateTime: () => dateTime(data)
    }
    return filter?.[type]?.();
}

export const ACTION_CONFIG = {
    edit: {
        icon: Edit,
         action:()=>{return 'edit'},
        class: "flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60",
    },
    delete: {
        icon: Trash,

        class: "flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60",
    },
    view: {
        icon: Eye,
        action:()=>{return 'view'},
        class: "flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60",
    },
};

export const dataTabelFilter = (collection: any,searchQuery:any) => {
    // const collection = Store[props?.state]?.payload ?? props.data ?? { data: [] }
    return collection.filter((item:any) => {
        const stng = JSON.stringify(item);
        return `${stng}`.toLowerCase().includes(searchQuery.toLowerCase())
    })

}
export function fetchTableData({data, props,Store}:{data:any,props:any,Store:any}) {
    const collection = {
        reload: 1,
        StateStore: props?.state,
        time: 0,
        reqs: {
            url: props?.url,
            method: 'post',
            data
        },
        mStore: { mUse: true },
    };
    return Store.stateGenaratorApi(collection);
}
