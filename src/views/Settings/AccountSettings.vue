<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <h3 class="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
        Account Settings
      </h3>

      <!-- Passkeys Section -->
      <div class="mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 p-5 lg:p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
              Passkeys
            </h4>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in quickly and securely with biometrics, PIN, or security keys
            </p>
          </div>
        </div>

        <!-- Passkey List -->
        <div v-if="passkeys.length > 0" class="mb-4 space-y-3">
          <div
            v-for="passkey in passkeys"
            :key="passkey.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 bg-brand-100 rounded-lg dark:bg-brand-900/30">
                <svg class="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ passkey.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatPasskeyDate(passkey.lastUsed || passkey.createdAt) }}
                </p>
              </div>
            </div>
            <button
              @click="handleDeletePasskey(passkey.id)"
              :disabled="isLoadingPasskeys"
              class="px-3 py-1 text-xs font-medium text-red-700 transition rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          </div>
        </div>

        <div v-if="passkeys.length === 0 && !isLoadingPasskeys" class="mb-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            No passkeys registered. Add a passkey to sign in faster and more securely.
          </p>
        </div>

        <button
          @click="handleAddPasskey"
          :disabled="isLoadingPasskeys || !isPasskeySupported"
          class="flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="isLoadingPasskeys" class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isPasskeySupported ? 'Add Passkey' : 'Passkeys Not Supported' }}
        </button>

        <p v-if="!isPasskeySupported" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Your browser doesn't support passkeys. Try using a modern browser like Chrome, Safari, or Edge.
        </p>
      </div>

      <!-- Change Password Section -->
      <div class="mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 p-5 lg:p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
              Change Password
            </h4>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <button
          @click="showPasswordModal = true"
          class="flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
        >
          Change Password
        </button>
      </div>

      <!-- 2FA Section -->
      <div class="mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 p-5 lg:p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
              Two-Factor Authentication (2FA)
            </h4>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <div
            v-if="user?.twoFactorEnabled"
            class="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400"
          >
            Active
          </div>
          <div
            v-else
            class="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full dark:bg-gray-800 dark:text-gray-400"
          >
            Inactive
          </div>
        </div>

        <!-- Enable 2FA Flow -->
        <div v-if="!user?.twoFactorEnabled && !showQRCode">
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Scan the QR code with your authentication app (Google Authenticator, Authy, etc.) to enable 2FA.
          </p>
          <button
            @click="handleEnable2FA"
            :disabled="isLoading"
            class="flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="mr-2">
              <svg
                class="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            Enable 2FA
          </button>
        </div>

        <!-- QR Code Display -->
        <div v-if="showQRCode && qrCodeData" class="mb-4">
          <div class="flex flex-col items-center p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
            <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Scan this QR code:
            </p>
            <img :src="qrCodeData" alt="2FA QR Code" class="mb-3 w-48 h-48" />
            <p class="mb-2 text-xs text-gray-600 dark:text-gray-400">
              Or manually enter this code:
            </p>
            <code
              class="px-3 py-2 text-xs font-mono text-gray-800 bg-white rounded dark:bg-gray-900 dark:text-gray-300"
            >
              {{ manualEntryKey }}
            </code>
          </div>

          <div class="mt-4">
            <label
              class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Enter the 6-digit code to confirm:
            </label>
            <div class="flex gap-2 justify-center mb-4">
              <input
                v-for="(digit, index) in confirm2FADigits"
                :key="index"
                :ref="el => { if (el) confirm2FAInputRefs[index] = el as HTMLInputElement }"
                v-model="confirm2FADigits[index]"
                type="text"
                inputmode="numeric"
                pattern="[0-9]"
                maxlength="1"
                @input="handleConfirm2FADigitInput(index, $event)"
                @keydown="handleConfirm2FAKeyDown(index, $event)"
                @paste="handleConfirm2FAPaste($event)"
                class="w-12 h-12 text-center text-lg font-semibold rounded-lg border-2 border-gray-300 bg-transparent text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-500 transition-colors"
              />
            </div>
            <div class="flex gap-3 mt-3">
              <button
                @click="handleConfirm2FA"
                :disabled="!isConfirm2FACodeComplete || isLoading"
                class="flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
              <button
                @click="cancelEnable2FA"
                class="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 transition rounded-lg border border-gray-300 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Disable 2FA -->
        <div v-if="user?.twoFactorEnabled" class="mt-4">
          <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Disabling 2FA will reduce your account security.
          </p>
          <button
            @click="showDisableModal = true"
            class="px-4 py-2 text-sm font-medium text-red-700 transition rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Disable 2FA
          </button>
        </div>
      </div>

      <!-- Add Passkey Modal -->
      <Modal v-if="showPasskeyModal" @close="showPasskeyModal = false">
        <template #body>
          <div
            class="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
          >
            <button
              @click="showPasskeyModal = false"
              class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
            >
              <svg
                class="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                  fill=""
                />
              </svg>
            </button>
            <div class="px-2 pr-14">
              <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Add Passkey
              </h4>
              <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                Give your passkey a name to help you identify it later (e.g., "iPhone 14 Pro", "YubiKey").
              </p>
            </div>
            <form @submit.prevent="handleRegisterPasskey" class="flex flex-col">
              <div class="custom-scrollbar overflow-y-auto p-2">
                <div class="mb-4">
                  <label
                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  >
                    Passkey Name<span class="text-error-500">*</span>
                  </label>
                  <input
                    v-model="passkeyName"
                    type="text"
                    required
                    placeholder="e.g., My iPhone"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
              <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <button
                  @click="showPasskeyModal = false"
                  type="button"
                  class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isLoadingPasskeys"
                  class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                >
                  Create Passkey
                </button>
              </div>
            </form>
          </div>
        </template>
      </Modal>

      <!-- Change Password Modal -->
      <Modal v-if="showPasswordModal" @close="showPasswordModal = false">
        <template #body>
          <div
            class="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
          >
            <button
              @click="showPasswordModal = false"
              class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
            >
              <svg
                class="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                  fill=""
                />
              </svg>
            </button>
            <div class="px-2 pr-14">
              <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Change Password
              </h4>
              <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                Enter your current password and choose a new password.
              </p>
            </div>
            <form @submit.prevent="handleChangePassword" class="flex flex-col">
              <div class="custom-scrollbar overflow-y-auto p-2">
                <div class="mb-4">
                  <label
                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  >
                    Current Password<span class="text-error-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      required
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                    <button
                      type="button"
                      @click="showCurrentPassword = !showCurrentPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg
                        v-if="showCurrentPassword"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="mb-4">
                  <label
                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  >
                    New Password<span class="text-error-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      required
                      minlength="8"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                    <button
                      type="button"
                      @click="showNewPassword = !showNewPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg
                        v-if="showNewPassword"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                  <!-- Password Strength Bar -->
                  <div v-if="newPassword" class="mt-2">
                    <div class="flex items-center gap-2 mb-1">
                      <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div
                          class="h-full transition-all duration-300 rounded-full"
                          :class="passwordStrength.color"
                          :style="{ width: passwordStrength.percentage + '%' }"
                        ></div>
                      </div>
                      <span
                        class="text-xs font-medium"
                        :class="passwordStrength.textColor"
                      >
                        {{ passwordStrength.label }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Minimum 8 characters
                    </p>
                  </div>
                  <p v-else class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Minimum 8 characters
                  </p>
                </div>
                <div class="mb-4">
                  <label
                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  >
                    Confirm New Password<span class="text-error-500">*</span>
                  </label>
                  <div class="relative">
                    <input
                      v-model="confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      required
                      minlength="8"
                      class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    />
                    <button
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <svg
                        v-if="showConfirmPassword"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <button
                  @click="showPasswordModal = false"
                  type="button"
                  class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isLoading"
                  class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </template>
      </Modal>

      <!-- Disable 2FA Modal -->
      <Modal v-if="showDisableModal" @close="showDisableModal = false">
        <template #body>
          <div
            class="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
          >
            <button
              @click="showDisableModal = false"
              class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
            >
              <svg
                class="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                  fill=""
                />
              </svg>
            </button>
            <div class="px-2 pr-14">
              <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                Disable 2FA
              </h4>
              <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                To disable 2FA, enter your password and current authentication code.
              </p>
            </div>
            <form @submit.prevent="handleDisable2FA" class="flex flex-col">
              <div class="custom-scrollbar overflow-y-auto p-2">
                <div class="mb-4">
                  <label
                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  >
                    Password<span class="text-error-500">*</span>
                  </label>
                  <input
                    v-model="disablePassword"
                    type="password"
                    required
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
                <div class="mb-4">
                  <label
                    class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
                  >
                    2FA Code<span class="text-error-500">*</span>
                  </label>
                  <div class="flex gap-2 justify-center">
                    <input
                      v-for="(digit, index) in disable2FADigits"
                      :key="index"
                      :ref="el => { if (el) disable2FAInputRefs[index] = el as HTMLInputElement }"
                      v-model="disable2FADigits[index]"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]"
                      maxlength="1"
                      @input="handleDisable2FADigitInput(index, $event)"
                      @keydown="handleDisable2FAKeyDown(index, $event)"
                      @paste="handleDisable2FAPaste($event)"
                      class="w-12 h-12 text-center text-lg font-semibold rounded-lg border-2 border-gray-300 bg-transparent text-gray-800 shadow-theme-xs focus:border-brand-500 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <button
                  @click="showDisableModal = false"
                  type="button"
                  class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="isLoading || !isDisable2FACodeComplete || !disablePassword"
                  class="flex w-full justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                >
                  Disable
                </button>
              </div>
            </form>
          </div>
        </template>
      </Modal>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/profile/Modal.vue'
import authService from '@/services/authService'
import userService from '@/services/userService'
import passkeyService from '@/services/passkeyService'
import type { Passkey } from '@/services/passkeyService'
import type { User } from '@/services/authService'
import { useToast } from 'vue-toastification'

const toast = useToast()
const currentPageTitle = ref('Account Settings')
const isLoading = ref(false)
const showQRCode = ref(false)
const qrCodeData = ref('')
const manualEntryKey = ref('')
const confirm2FADigits = ref<string[]>(['', '', '', '', '', ''])
const confirm2FAInputRefs = ref<(HTMLInputElement | null)[]>([])
const showDisableModal = ref(false)
const disablePassword = ref('')
const disable2FADigits = ref<string[]>(['', '', '', '', '', ''])
const disable2FAInputRefs = ref<(HTMLInputElement | null)[]>([])

// Password change fields
const showPasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Passkey fields
const passkeys = ref<Passkey[]>([])
const isLoadingPasskeys = ref(false)
const isPasskeySupported = ref(false)
const showPasskeyModal = ref(false)
const passkeyName = ref('')

const user = ref<User | null>(authService.getCurrentUser())

// Computed para verificar si el código de confirmación está completo
const isConfirm2FACodeComplete = computed(() => {
  return confirm2FADigits.value.every(digit => digit !== '') && confirm2FADigits.value.length === 6
})

// Computed para obtener el código completo de confirmación
const confirm2FACode = computed(() => {
  return confirm2FADigits.value.join('')
})

// Computed para obtener el código completo de deshabilitar
const disable2FACode = computed(() => {
  return disable2FADigits.value.join('')
})

// Computed para verificar si el código de deshabilitar está completo
const isDisable2FACodeComplete = computed(() => {
  return disable2FADigits.value.every(digit => digit !== '') && disable2FADigits.value.length === 6
})

onMounted(async () => {
  try {
    const updatedUser = await authService.getMe()
    user.value = updatedUser

    // Check passkey support
    isPasskeySupported.value = passkeyService.isSupported()

    // Load passkeys if supported
    if (isPasskeySupported.value) {
      await loadPasskeys()
    }
  } catch (error) {
    console.error('Error cargando usuario:', error)
  }
})

// Watch para enfocar el primer campo cuando se abre el modal de deshabilitar
watch(showDisableModal, async (newValue) => {
  if (newValue) {
    // Limpiar los campos y esperar a que el modal se renderice
    disable2FADigits.value = ['', '', '', '', '', '']
    await nextTick()
    // Enfocar el primer campo de código 2FA
    disable2FAInputRefs.value[0]?.focus()
  }
})

const loadPasskeys = async () => {
  try {
    isLoadingPasskeys.value = true
    passkeys.value = await passkeyService.listPasskeys()
  } catch (error: any) {
    console.error('Error loading passkeys:', error)
    toast.error(error.message || 'Failed to load passkeys')
  } finally {
    isLoadingPasskeys.value = false
  }
}

const handleAddPasskey = () => {
  passkeyName.value = ''
  showPasskeyModal.value = true
}

const handleRegisterPasskey = async () => {
  if (!passkeyName.value.trim()) {
    toast.error('Please enter a name for your passkey')
    return
  }

  isLoadingPasskeys.value = true

  try {
    await passkeyService.registerPasskey(passkeyName.value.trim())
    toast.success('Passkey registered successfully')
    showPasskeyModal.value = false
    passkeyName.value = ''
    await loadPasskeys()
  } catch (error: any) {
    console.error('Error registering passkey:', error)
    
    // Mostrar mensaje de error más específico
    let errorMessage = 'Failed to register passkey'
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.error) {
      errorMessage = `Error: ${error.response.data.error}`
    }
    
    // Mensajes específicos para errores comunes
    if (errorMessage.includes('not supported')) {
      errorMessage = 'Passkeys are not supported on this device or browser. Please use a modern browser like Chrome, Safari, or Edge.'
    } else if (errorMessage.includes('cancelled')) {
      errorMessage = 'Passkey registration was cancelled'
    } else if (errorMessage.includes('User email')) {
      errorMessage = 'Your account email is required. Please update your profile.'
    }
    
    toast.error(errorMessage)
  } finally {
    isLoadingPasskeys.value = false
  }
}

const handleDeletePasskey = async (id: string) => {
  if (!confirm('Are you sure you want to delete this passkey?')) {
    return
  }

  isLoadingPasskeys.value = true

  try {
    await passkeyService.deletePasskey(id)
    toast.success('Passkey deleted successfully')
    await loadPasskeys()
  } catch (error: any) {
    console.error('Error deleting passkey:', error)
    toast.error(error.message || 'Failed to delete passkey')
  } finally {
    isLoadingPasskeys.value = false
  }
}

const formatPasskeyDate = (dateString: string | null): string => {
  if (!dateString) return 'Never used'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Used today'
  if (diffDays === 1) return 'Used yesterday'
  if (diffDays < 7) return `Used ${diffDays} days ago`
  if (diffDays < 30) return `Used ${Math.floor(diffDays / 7)} weeks ago`

  return `Added ${date.toLocaleDateString()}`
}

const handleEnable2FA = async () => {
  isLoading.value = true

  try {
    const data = await authService.enable2FA()
    qrCodeData.value = data.qrCode
    manualEntryKey.value = data.manualEntryKey
    showQRCode.value = true
    // Limpiar los campos y enfocar el primero
    confirm2FADigits.value = ['', '', '', '', '', '']
    await nextTick()
    confirm2FAInputRefs.value[0]?.focus()
  } catch (error: any) {
    toast.error(error.message || 'Failed to enable 2FA')
  } finally {
    isLoading.value = false
  }
}

// Funciones para manejar los inputs del código de confirmación
const handleConfirm2FADigitInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/[^0-9]/g, '')
  
  // Solo tomar el último carácter si hay más de uno
  const digit = value.slice(-1)
  
  if (digit) {
    confirm2FADigits.value[index] = digit
    // Mover al siguiente campo si hay uno
    if (index < 5) {
      nextTick(() => {
        confirm2FAInputRefs.value[index + 1]?.focus()
      })
    }
  } else {
    confirm2FADigits.value[index] = ''
  }
}

const handleConfirm2FAKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !confirm2FADigits.value[index] && index > 0) {
    // Si el campo está vacío y presionas backspace, ir al campo anterior
    nextTick(() => {
      confirm2FAInputRefs.value[index - 1]?.focus()
    })
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    confirm2FAInputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < 5) {
    event.preventDefault()
    confirm2FAInputRefs.value[index + 1]?.focus()
  }
}

const handleConfirm2FAPaste = async (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('')
  
  // Llenar los campos con los dígitos pegados
  for (let i = 0; i < 6; i++) {
    if (i < digits.length) {
      confirm2FADigits.value[i] = digits[i]
    } else {
      confirm2FADigits.value[i] = ''
    }
  }
  
  // Enfocar el último campo llenado o el primero vacío
  await nextTick()
  const nextIndex = Math.min(digits.length, 5)
  confirm2FAInputRefs.value[nextIndex]?.focus()
}

const handleConfirm2FA = async () => {
  const code = confirm2FACode.value
  if (code.length !== 6) {
    toast.error('Code must be 6 digits')
    return
  }

  isLoading.value = true

  try {
    await authService.confirm2FA(code)
    toast.success('2FA enabled successfully')
    showQRCode.value = false
    confirm2FADigits.value = ['', '', '', '', '', '']
    // Recargar información del usuario y actualizar el estado reactivo
    const updatedUser = await authService.getMe()
    user.value = updatedUser
  } catch (error: any) {
    toast.error(error.message || 'Invalid code')
    // Limpiar los campos en caso de error
    confirm2FADigits.value = ['', '', '', '', '', '']
    await nextTick()
    confirm2FAInputRefs.value[0]?.focus()
  } finally {
    isLoading.value = false
  }
}

const cancelEnable2FA = () => {
  showQRCode.value = false
  qrCodeData.value = ''
  manualEntryKey.value = ''
  confirm2FADigits.value = ['', '', '', '', '', '']
}

// Funciones para manejar los inputs del código de deshabilitar
const handleDisable2FADigitInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/[^0-9]/g, '')
  
  // Solo tomar el último carácter si hay más de uno
  const digit = value.slice(-1)
  
  if (digit) {
    disable2FADigits.value[index] = digit
    // Mover al siguiente campo si hay uno
    if (index < 5) {
      nextTick(() => {
        disable2FAInputRefs.value[index + 1]?.focus()
      })
    }
  } else {
    disable2FADigits.value[index] = ''
  }
}

const handleDisable2FAKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !disable2FADigits.value[index] && index > 0) {
    // Si el campo está vacío y presionas backspace, ir al campo anterior
    nextTick(() => {
      disable2FAInputRefs.value[index - 1]?.focus()
    })
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    disable2FAInputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < 5) {
    event.preventDefault()
    disable2FAInputRefs.value[index + 1]?.focus()
  }
}

const handleDisable2FAPaste = async (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('')
  
  // Llenar los campos con los dígitos pegados
  for (let i = 0; i < 6; i++) {
    if (i < digits.length) {
      disable2FADigits.value[i] = digits[i]
    } else {
      disable2FADigits.value[i] = ''
    }
  }
  
  // Enfocar el último campo llenado o el primero vacío
  await nextTick()
  const nextIndex = Math.min(digits.length, 5)
  disable2FAInputRefs.value[nextIndex]?.focus()
}

const handleDisable2FA = async () => {
  const code = disable2FACode.value
  if (!disablePassword.value || code.length !== 6) {
    toast.error('Please complete all fields')
    return
  }

  isLoading.value = true

  try {
    await authService.disable2FA(disablePassword.value, code)
    toast.success('2FA disabled successfully')
    showDisableModal.value = false
    disablePassword.value = ''
    disable2FADigits.value = ['', '', '', '', '', '']
    // Recargar información del usuario y actualizar el estado reactivo
    const updatedUser = await authService.getMe()
    user.value = updatedUser
  } catch (error: any) {
    toast.error(error.message || 'Failed to disable 2FA')
    // Limpiar los campos en caso de error
    disable2FADigits.value = ['', '', '', '', '', '']
    await nextTick()
    disable2FAInputRefs.value[0]?.focus()
  } finally {
    isLoading.value = false
  }
}

// Password strength calculator
const calculatePasswordStrength = (password: string) => {
  if (!password) {
    return {
      score: 0,
      percentage: 0,
      label: '',
      color: '',
      textColor: '',
    }
  }

  let score = 0
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  }

  // Calculate score
  if (checks.length) score += 1
  if (checks.lowercase) score += 1
  if (checks.uppercase) score += 1
  if (checks.numbers) score += 1
  if (checks.special) score += 1

  // Bonus for longer passwords
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Determine strength level
  let label = ''
  let color = ''
  let textColor = ''
  let percentage = 0

  if (score <= 2) {
    label = 'Weak'
    color = 'bg-red-500'
    textColor = 'text-red-600 dark:text-red-400'
    percentage = 33
  } else if (score <= 4) {
    label = 'Fair'
    color = 'bg-yellow-500'
    textColor = 'text-yellow-600 dark:text-yellow-400'
    percentage = 66
  } else if (score <= 6) {
    label = 'Good'
    color = 'bg-blue-500'
    textColor = 'text-blue-600 dark:text-blue-400'
    percentage = 85
  } else {
    label = 'Strong'
    color = 'bg-green-500'
    textColor = 'text-green-600 dark:text-green-400'
    percentage = 100
  }

  return {
    score,
    percentage,
    label,
    color,
    textColor,
  }
}

const passwordStrength = computed(() => {
  return calculatePasswordStrength(newPassword.value)
})

const handleChangePassword = async () => {
  // Validate passwords match
  if (newPassword.value !== confirmPassword.value) {
    toast.error('New passwords do not match')
    return
  }

  // Validate password length
  if (newPassword.value.length < 8) {
    toast.error('Password must be at least 8 characters')
    return
  }

  isLoading.value = true

  try {
    await userService.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    toast.success('Password changed successfully')
    showPasswordModal.value = false
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
  } catch (error: any) {
    toast.error(error.message || 'Failed to change password')
  } finally {
    isLoading.value = false
  }
}
</script>

