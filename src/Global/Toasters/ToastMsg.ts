import { toast } from 'vue-sonner';

interface INotify {
    label?: string;
    callback?: (event: Event) => void;
    pos?: 'tl' | 'tr' | 'bl' | 'br';
    msg?: string;
    type?:
        | 'default'
        | 'description'
        | 'success'
        | 'info'
        | 'warning'
        | 'error'
        | 'action'
        | 'promise';
}

export function notify({
    label,
    callback,
    pos = 'tr',
    msg = 'Action was successful',
    type = 'success',
}: INotify) {

    const positions: Record<string, any> = {
        tl: 'top-left',
        tr: 'top-right',
        bl: 'bottom-left',
        br: 'bottom-right',
    };

    const options = {
        position: positions[pos],
    };

    switch (type.toLocaleLowerCase()) {
        case 'success':
            toast.success(msg, options);
            break;

        case 'info':
        case 'description':
            toast.info(msg, options);
            break;

        case 'warning':
            toast.warning(msg, options);
            break;

        case 'error':
            toast.error(msg, options);
            break;

        case 'promise':
            // Example usage: notify({ type: 'promise', msg: promise })
            (toast as any).promise(msg as any, {
                loading: 'Loading...',
                success: 'Completed successfully',
                error: 'Something went wrong',
                position: positions[pos],
            });
            break;

        case 'action':
            toast(msg, {
                ...options,
                action: {
                    label: label || 'Undo',
                    onClick: (e: Event) => callback?.(e),
                },
            });
            break;

        default:
            toast(msg, options);
            break;
    }
}