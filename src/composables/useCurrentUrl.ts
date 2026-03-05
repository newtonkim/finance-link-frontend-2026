import { computed, readonly } from 'vue';
import { useRoute } from 'vue-router';
import type { ComputedRef, DeepReadonly } from 'vue';

export type UseCurrentUrlReturn = {
    currentUrl: DeepReadonly<ComputedRef<string>>;
    isCurrentUrl: (urlToCheck: string, currentUrl?: string) => boolean;
    whenCurrentUrl: <T, F = null>(urlToCheck: string, ifTrue: T, ifFalse?: F) => T | F;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const route = useRoute();

    const currentUrlReactive = computed(() => route.path);

    function isCurrentUrl(urlToCheck: string, currentUrl?: string) {
        const urlToCompare = currentUrl ?? currentUrlReactive.value;

        // Remove query params and trailing slashes for comparison if needed
        const cleanUrl = (url: string) =>
            (url.split('?')[0] ?? '/').replace(/\/$/, '') || '/';

        return cleanUrl(urlToCheck) === cleanUrl(urlToCompare);
    }

    function whenCurrentUrl(urlToCheck: string, ifTrue: any, ifFalse: any = null) {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    }

    return {
        currentUrl: readonly(currentUrlReactive) as DeepReadonly<ComputedRef<string>>,
        isCurrentUrl,
        whenCurrentUrl,
    };
}
