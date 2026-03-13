import { toast } from 'vue-sonner';
/**
 *  type:|Default|Description|Success|Info|Warning|Error|Action|Promise
 *  pos:|Default|top-left|top-right|bottom-left|bottom-right
 *  msg:message to toster
 *  calback:Function to help the action
 * **/
interface INotify {
    label?: string;
    callback?: (event: Event) => void;
    pos?: 'tl' | 'tr' | 'bl' | 'br';
    msg?: string;
    type?:
        | 'Default'
        | 'Description'
        | 'Success'
        | 'Info'
        | 'Warning'
        | 'Error'
        | 'Action'
        | 'Promise';
}

export function notify({
    label,
    callback,
    pos = 'tl',
    msg = 'Action was successful',
    type = 'Default',
}: INotify) {
    const definePosition: Record<string, string> = {
        tl: 'top-left',
        tr: 'top-right',
        bl: 'bottom-left',
        br: 'bottom-right',
    };
    const typeCheck = type.toLowerCase();
    const typeMap: Record<string, keyof typeof toast> = {
        default: 'success',
        description: 'info',
        success: 'success',
        info: 'info',
        warning: 'warning',
        error: 'error',
        promise: 'loading',
    };
    switch (typeCheck) {
        case 'default':
        case 'description':
        case 'success':
        case 'info':
        case 'warning':
        case 'error':{
        toast?.[typeCheck]?.('Event has been created')
        return
    }
        case 'promise': {
            const toastMethod = typeMap[typeCheck as keyof typeof typeMap];
            if (toastMethod) {
                (toast[toastMethod] as Function)(msg, {
                    position: definePosition[pos],
                });
            }
            break;
        }
        default:

        case 'action':
            toast(msg, {
                action: {
                    label,
                    onClick: (e: Event) => callback?.(e),
                },
            });
            break;
    }
}
