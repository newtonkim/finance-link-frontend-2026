<template>
    <div class="auth-container">
        <div class="auth-card">
            <div class="brand">
                <h1 class="text-gradient">Mfuko Pro</h1>
                <p>Start your financial management journey</p>
            </div>

            <form @submit.prevent="handleRegister" class="auth-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstName">First Name</label>
                        <input type="text" id="firstName" v-model="firstName" placeholder="John" required>
                    </div>
                    <div class="form-group">
                        <label for="lastName">Last Name</label>
                        <input type="text" id="lastName" v-model="lastName" placeholder="Doe" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" v-model="email" placeholder="john@company.com" required>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" v-model="password" placeholder="••••••••" required>
                    <p class="input-hint">At least 8 characters long</p>
                </div>

                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="••••••••"
                        required>
                </div>

                <div class="auth-actions">
                    <label class="terms">
                        <input type="checkbox" v-model="acceptTerms" required>
                        <span>I accept the <a href="#">Terms & Conditions</a></span>
                    </label>
                </div>

                <button type="submit" class="submit-btn" :disabled="loading">
                    <span v-if="!loading">Create Account</span>
                    <span v-else class="loader"></span>
                </button>
            </form>

            <div class="auth-footer">
                <p>Already have an account? <router-link to="/central/login">Sign in</router-link></p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptTerms = ref(false)
const loading = ref(false)

const router = useRouter()

const handleRegister = async () => {
    if (password.value !== confirmPassword.value) {
        alert('Passwords do not match')
        return
    }

    loading.value = true
    try {
        console.log('Registering user...')
        setTimeout(() => {
            loading.value = false
            router.push('/central/login')
        }, 2000)
    } catch (error) {
        console.error('Registration failed', error)
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
    background: radial-gradient(circle at bottom left, #05291d, #021a12);
    padding: 20px;
}

.auth-card {
    width: 100%;
    max-width: 500px;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.brand {
    text-align: center;
    margin-bottom: 32px;
}

.brand h1 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
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
    gap: 20px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
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

input {
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

.input-hint {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
}

.auth-actions {
    font-size: 14px;
    margin-top: 4px;
}

.terms {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #94a3b8;
    cursor: pointer;
}

.terms a {
    color: #22c55e;
    text-decoration: underline;
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
    margin-top: 12px;
}

.submit-btn:hover:not(:disabled) {
    background: #4ade80;
    transform: translateY(-1px);
}

.submit-btn:disabled {
    opacity: 0.7;
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
