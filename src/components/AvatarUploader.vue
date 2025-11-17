<template>
  <div class="avatar-uploader">
    <!-- Avatar Display -->
    <div class="avatar-container">
      <div v-if="avatarPreview || currentAvatar" class="avatar-preview">
        <img :src="avatarPreview || currentAvatar" alt="Avatar" class="avatar-image" />
        <div class="avatar-overlay">
          <button @click="openFileDialog" class="overlay-btn" type="button" title="Change photo">
            <Camera :size="20" />
          </button>
          <button @click="removeAvatar" class="overlay-btn" type="button" title="Remove photo">
            <Trash2 :size="20" />
          </button>
        </div>
      </div>
      <div v-else class="avatar-placeholder" @click="openFileDialog">
        <div class="avatar-initials">
          {{ getUserInitials() }}
        </div>
        <div class="avatar-placeholder-overlay">
          <Camera :size="20" />
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/jpg,image/webp,image/gif"
      @change="handleFileSelect"
      class="hidden-input"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :is-open="showDeleteConfirm"
      title="Remove Profile Photo"
      message="Are you sure you want to remove your profile photo? This action cannot be undone."
      confirm-text="Remove Photo"
      cancel-text="Cancel"
      loading-text="Removing..."
      variant="danger"
      :is-loading="isDeleting"
      @confirm="confirmRemoveAvatar"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Cropper Modal -->
    <transition name="modal">
      <div v-if="showCropperModal" class="modal-overlay" @click.self="closeCropperModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3>Crop your photo</h3>
            <button @click="closeCropperModal" class="close-btn" type="button">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div class="cropper-wrapper">
              <Cropper
                ref="cropper"
                :src="selectedImage"
                :stencil-props="{
                  aspectRatio: 1,
                }"
                class="cropper"
                image-restriction="stencil"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeCropperModal" class="btn btn-secondary" type="button">
              Cancel
            </button>
            <button @click="cropAndUpload" class="btn btn-primary" type="button" :disabled="uploading">
              {{ uploading ? 'Uploading...' : 'Upload Photo' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import Compressor from 'compressorjs';
import { Camera, Trash2, X } from 'lucide-vue-next';
import authService from '@/services/authService';
import { useToast } from 'vue-toastification';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';

const props = defineProps({
  currentAvatar: {
    type: String,
    default: null,
  },
  userName: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['avatar-updated', 'avatar-removed']);

const toast = useToast();

const fileInput = ref(null);
const selectedImage = ref(null);
const avatarPreview = ref(null);
const showCropperModal = ref(false);
const showDeleteConfirm = ref(false);
const cropper = ref(null);
const uploading = ref(false);
const isDeleting = ref(false);

// Get current user as fallback
const currentUser = computed(() => authService.getCurrentUser());

// Computed to get the user name with fallback
const displayUserName = computed(() => {
  return props.userName || currentUser.value?.name || null;
});

// Get user initials from name
const getUserInitials = () => {
  const nameToUse = displayUserName.value;
  
  if (!nameToUse || !nameToUse.trim()) return 'U';
  
  const parts = nameToUse.trim().split(/\s+/);
  if (parts.length === 0) return 'U';
  
  if (parts.length === 1) {
    // Only one name, return first two letters
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // First name and first letter of last name
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
};

const openFileDialog = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validar tamaño (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File size must be less than 5MB');
    return;
  }

  // Validar tipo
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
    return;
  }

  // Crear preview
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage.value = e.target.result;
    showCropperModal.value = true;
  };
  reader.readAsDataURL(file);

  // Reset input
  event.target.value = '';
};

const closeCropperModal = () => {
  showCropperModal.value = false;
  selectedImage.value = null;
};

const cropAndUpload = async () => {
  if (!cropper.value) return;

  uploading.value = true;

  try {
    const { canvas } = cropper.value.getResult();

    // Convertir canvas a blob
    canvas.toBlob(async (blob) => {
      // Comprimir imagen
      new Compressor(blob, {
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        success: async (compressedBlob) => {
          try {
            // Crear FormData
            const formData = new FormData();
            formData.append('avatar', compressedBlob, 'avatar.jpg');

            // Subir al servidor
            const token = localStorage.getItem('accessToken');

            if (!token) {
              throw new Error('Not authenticated. Please log in again.');
            }

            const response = await fetch('/api/users/me/avatar', {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            // Verificar si hay contenido antes de parsear JSON
            const text = await response.text();
            let data;

            try {
              data = text ? JSON.parse(text) : {};
            } catch (e) {
              console.error('JSON parse error. Response text:', text);
              console.error('Parse error:', e);
              throw new Error('Invalid server response. Please try again.');
            }

            if (!response.ok) {
              if (response.status === 401) {
                throw new Error('Session expired. Please log in again.');
              }
              throw new Error(data.message || `Error: ${response.status}`);
            }

            // Actualizar preview local
            avatarPreview.value = data.data.user.avatar;

            // Actualizar el usuario en authService
            await authService.getMe();

            toast.success('Avatar uploaded successfully');
            emit('avatar-updated', data.data.user.avatar);
            closeCropperModal();
          } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Error uploading avatar');
          } finally {
            uploading.value = false;
          }
        },
        error: (err) => {
          console.error('Compression error:', err);
          toast.error('Error compressing image');
          uploading.value = false;
        },
      });
    }, 'image/jpeg', 0.9);
  } catch (error) {
    console.error('Crop error:', error);
    toast.error('Error cropping image');
    uploading.value = false;
  }
};

const removeAvatar = () => {
  showDeleteConfirm.value = true;
};

const confirmRemoveAvatar = async () => {
  isDeleting.value = true;

  try {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }

    const response = await fetch('/api/users/me/avatar', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Verificar si hay contenido antes de parsear JSON
    const text = await response.text();
    let data;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error. Response text:', text);
      console.error('Parse error:', e);
      throw new Error('Invalid server response. Please try again.');
    }

    if (!response.ok) {
      // Si es error 401, puede que el token expiró
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(data.message || `Error: ${response.status}`);
    }

    avatarPreview.value = null;

    // Actualizar el usuario en authService
    await authService.getMe();

    showDeleteConfirm.value = false;
    toast.success('Profile photo removed successfully');
    emit('avatar-removed');
  } catch (error) {
    console.error('Remove error:', error);
    toast.error(error.message || 'Error removing avatar');
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-container {
  position: relative;
  width: 150px;
  height: 150px;
}

.avatar-preview {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--color-border);
  transition: all 0.3s ease;
}

.avatar-preview:hover {
  border-color: var(--color-primary);
}

.avatar-preview:hover .avatar-overlay {
  opacity: 1;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.overlay-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text);
}

.overlay-btn:hover {
  background: white;
  transform: scale(1.1);
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgb(70, 95, 255);
  color: white;
  position: relative;
  overflow: hidden;
}

.avatar-placeholder:hover {
  border-color: var(--color-primary);
  opacity: 0.9;
}

.avatar-placeholder:hover .avatar-placeholder-overlay {
  opacity: 1;
}

.avatar-initials {
  font-size: 3rem;
  font-weight: 600;
  color: white;
  z-index: 1;
}

.avatar-placeholder-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.hidden-input {
  display: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: var(--color-surface);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.modal-body {
  padding: 1.5rem;
  overflow: auto;
  flex: 1;
}

.cropper-wrapper {
  width: 100%;
  height: 400px;
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
}

.cropper {
  height: 100%;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .modal-container {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }
}
</style>
