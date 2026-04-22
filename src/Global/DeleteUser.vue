<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue';
import { apiClient } from '@/central/api/client';
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

const passwordInput = useTemplateRef('passwordInput');
const processing = ref(false);
const errors = reactive<Record<string, string>>({});
const form = reactive({ password: '' });

const clearForm = () => {
    form.password = '';
    Object.keys(errors).forEach((key) => delete errors[key]);
};

const submitDelete = async () => {
    processing.value = true;
    Object.keys(errors).forEach((key) => delete errors[key]);

    try {
        await apiClient.delete('/user', { data: { password: form.password } });
        clearForm();
    } catch (error: any) {
        if (error.response?.status === 422) {
            const payload = error.response.data?.errors || {};
            Object.assign(errors, {
                password: payload.password?.[0] || 'Invalid password.',
            });
            ;(passwordInput.value as any)?.focus();
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
            <Dialog>
                <DialogTrigger as-child>
                    <Button variant="destructive" data-test="delete-user-button"
                        >Delete account</Button
                    >
                </DialogTrigger>
                <DialogContent>
                    <form class="space-y-6" @submit.prevent="submitDelete">
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
                                ref="passwordInput"
                                placeholder="Password"
                                v-model="form.password"
                            />
                            <InputError :message="errors.password" />
                        </div>

                        <DialogFooter class="gap-2">
                            <DialogClose as-child>
                                <Button
                                    variant="secondary"
                                    @click="clearForm"
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
                                Delete account
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    </div>
</template>
