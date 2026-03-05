<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import Heading from '@/Global/Heading.vue';
import InputError from '@/Global/InputError.vue';
import { Button } from '@/Global/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Global/ui/dialog';
import { Input } from '@/Global/ui/input';
import { Label } from '@/Global/ui/label';
import { apiClient } from '@/central/api/client';
import { useAuthStore } from '@/stores/auth';

const passwordInput = useTemplateRef('passwordInput');
const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const processing = ref(false);
const errors = ref<Record<string, string>>({});

const clearErrors = () => {
    errors.value = {};
};

const reset = () => {
    password.value = '';
    clearErrors();
};

const deleteAccount = async () => {
    processing.value = true;
    clearErrors();

    try {
        await apiClient.delete('/settings/profile', {
            data: { password: password.value },
        });

        // After successful deletion, logout and redirect
        await authStore.logout();
        router.push('/login');
    } catch (error: any) {
        if (error.response?.status === 422) {
            errors.value = error.response.data.errors || {};
            passwordInput.value?.$el?.focus();
        } else {
            console.error('Failed to delete account:', error);
        }
    } finally {
        processing.value = false;
    }
};
</script>

<template>
    <div class="space-y-6">
        <Heading
            variant="small"
            title="Delete account"
            description="Delete your account and all of its resources"
        />
        <div
            class="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10"
        >
            <div class="relative space-y-0.5 text-red-600 dark:text-red-100">
                <p class="font-medium">Warning</p>
                <p class="text-sm">
                    Please proceed with caution, this cannot be undone.
                </p>
            </div>
            <Dialog @update:open="(val) => !val && reset()">
                <DialogTrigger as-child>
                    <Button variant="destructive" data-test="delete-user-button"
                        >Delete account</Button
                    >
                </DialogTrigger>
                <DialogContent>
                    <form @submit.prevent="deleteAccount" class="space-y-6">
                        <DialogHeader class="space-y-3">
                            <DialogTitle
                                >Are you sure you want to delete your
                                account?</DialogTitle
                            >
                            <DialogDescription>
                                Once your account is deleted, all of its
                                resources and data will also be permanently
                                deleted. Please enter your password to confirm
                                you would like to permanently delete your
                                account.
                            </DialogDescription>
                        </DialogHeader>

                        <div class="grid gap-2">
                            <Label for="password" class="sr-only"
                                >Password</Label
                            >
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                v-model="password"
                                ref="passwordInput"
                                placeholder="Password"
                                :disabled="processing"
                            />
                            <InputError :message="errors.password" />
                        </div>

                        <DialogFooter class="gap-2">
                            <DialogClose as-child>
                                <Button
                                    variant="secondary"
                                    type="button"
                                    @click="reset"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                type="submit"
                                variant="destructive"
                                :disabled="processing"
                                data-test="confirm-delete-user-button"
                            >
                                <template v-if="processing">Deleting...</template>
                                <template v-else>Delete account</template>
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    </div>
</template>
