<template>
    <div class="auth-container">
        <div class="auth-card">
            <div class="brand">
                <h1 class="text-gradient">Mfuko Pro</h1>
                <p>Access your central dashboard</p>
            </div>

            <form @submit.prevent="handleLogin" class="auth-form">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" v-model="email" placeholder="name@company.com" required>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="password-input">
                        <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password"
                            placeholder="••••••••" required>
                        <button type="button" @click="showPassword = !showPassword" class="toggle-password">
                            {{ showPassword ? 'Hide' : 'Show' }}
                        </button>
                    </div>
                </div>

                <div class="auth-actions">
                    <label class="remember-me">
                        <input type="checkbox" v-model="rememberMe">
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="forgot-password">Forgot password?</a>
                </div>

                <button type="submit" class="submit-btn" :disabled="loading">
                    <span v-if="!loading">Sign In</span>
                    <span v-else class="loader"></span>
                </button>
            </form>

            <div class="auth-footer">
                <p>Don't have an account? <router-link to="/central/register">Create one</router-link></p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const loading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
    loading.value = true
    try {
        // Logic for login via authStore
        // await authStore.login({ email: email.value, password: password.value })
        console.log('Logging in...')
        setTimeout(() => {
            loading.value = false
            router.push('/central')
        }, 1500)
    } catch (error) {
        console.error('Login failed', error)
        loading.value = false
    }
}
</script>

<style scoped>
.auth-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: radial-gradient(circle at top right, #05291d, #021a12);
    padding: 20px;
}

.auth-card {
    width: 100%;
    max-width: 440px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.brand {
    text-align: center;
    margin-bottom: 40px;
}

.brand h1 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.text-gradient {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.brand p {
    color: #94a3b8;
    font-size: 15px;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #e2e8f0;
}

input[type="email"],
input[type="password"],
input[type="text"] {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px 16px;
    color: white;
    font-size: 15px;
    transition: all 0.2s;
    outline: none;
}

input:focus {
    border-color: #22c55e;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
}

.password-input {
    position: relative;
    display: flex;
}

.password-input input {
    width: 100%;
}

.toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 8px;
}

.auth-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.remember-me {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #94a3b8;
    cursor: pointer;
}

.forgot-password {
    color: #22c55e;
    text-decoration: none;
    font-weight: 500;
}

.submit-btn {
    background: #22c55e;
    color: #05291d;
    border: none;
    border-radius: 12px;
    padding: 14px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
    background: #4ade80;
    transform: translateY(-1px);
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.auth-footer {
    margin-top: 32px;
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
}

.auth-footer a {
    color: #22c55e;
    text-decoration: none;
    font-weight: 600;
}

.loader {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(5, 41, 29, 0.3);
    border-top: 3px solid #05291d;
    border-radius: 50%;
    display: inline-block;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
