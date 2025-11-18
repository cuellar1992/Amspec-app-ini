<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Sampling Roster" />

    <div class="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Left: Form -->
      <ComponentCard title="New Sampling Roster" description="Register a new sampling roster entry" class="lg:col-span-2">
        <div class="p-6">
          <form class="space-y-6" @keydown.enter.prevent>

            <!-- Search Ship Nomination -->
            <div class="pb-4 border-b border-gray-200 dark:border-gray-700">
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Search Ship Nomination
              </label>
              <div class="relative">
                <input
                  v-model="searchQuery"
                  @input="handleSearch"
                  @focus="showDropdown = true"
                  type="text"
                  class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                  placeholder="Search by vessel name or AmSpec reference..."
                />
                <svg
                  class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                <!-- Info message when showing only recent items -->
                <div
                  v-if="showDropdown && !searchQuery && filteredShipNominations.length > 0"
                  class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-blue-50 shadow-lg dark:border-gray-700 dark:bg-blue-900/20 p-3 mb-1"
                >
                  <p class="text-xs text-blue-700 dark:text-blue-300">
                    Showing last 5 ship nominations. Type to search all records.
                  </p>
                </div>

                <!-- Dropdown Results -->
                <div
                  v-if="showDropdown && filteredShipNominations.length > 0"
                  :class="[
                    'absolute z-10 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-60 overflow-y-auto',
                    !searchQuery ? 'mt-16' : 'mt-1'
                  ]"
                >
                  <button
                    v-for="ship in filteredShipNominations"
                    :key="ship._id"
                    type="button"
                    @click="selectShipNomination(ship)"
                    class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                  >
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ ship.vesselName }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          Ref: {{ ship.amspecReference }}
                        </p>
                      </div>
                      <span
                        class="text-xs px-2 py-1 rounded-full"
                        :class="getStatusBadgeClass(ship.status)"
                      >
                        {{ ship.status || 'pending' }}
                      </span>
                    </div>
                    <div v-if="ship.berth || ship.etb" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span v-if="ship.berth">Berth: {{ ship.berth }}</span>
                      <span v-if="ship.berth && ship.etb"> | </span>
                      <span v-if="ship.etb">ETB: {{ formatDateShort(ship.etb) }}</span>
                    </div>
                  </button>
                </div>

                <!-- No results message -->
                <div
                  v-if="showDropdown && searchQuery && filteredShipNominations.length === 0 && !isLoadingShips"
                  class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 p-4"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                    No ship nominations found for "{{ searchQuery }}"
                  </p>
                </div>

                <!-- Loading indicator -->
                <div
                  v-if="isLoadingShips"
                  class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 p-4"
                >
                  <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Loading...
                  </p>
                </div>
              </div>
            </div>

            <!-- Vessel -->
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Vessel <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.vessel"
                type="text"
                readonly
                class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                placeholder="Select from Ship Nomination"
              />
            </div>

            <!-- Row: Berth + AmSpec Ref -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Berth <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.berth"
                  type="text"
                  readonly
                  class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  placeholder="From Ship Nomination"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  AmSpec Ref <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.amspecRef"
                  type="text"
                  readonly
                  class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  placeholder="From Ship Nomination"
                />
              </div>
            </div>

            <!-- Row: POB + ETB -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  POB <span class="text-red-500">*</span>
                </label>
                <flat-pickr
                  v-model="formData.pob"
                  :config="dateTimeConfig"
                  @on-change="handlePobChange"
                  class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                  placeholder="Select date and time"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  ETB <span class="text-red-500">*</span>
                </label>
                <flat-pickr
                  v-model="formData.etb"
                  :config="dateTimeConfig"
                  @on-change="handleEtbChange"
                  class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                  placeholder="Select date and time"
                />
              </div>
            </div>

            <!-- Row: Start Discharge + Discharge Time (Hrs) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Start Discharge <span class="text-red-500">*</span>
                </label>
                <flat-pickr
                  v-model="formData.startDischarge"
                  :config="dateTimeConfig"
                  @on-change="handleStartDischargeChange"
                  class="h-11 w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-hidden focus:ring-3 dark:bg-gray-800 dark:text-white"
                  :class="submittedOnce && !formData.startDischarge ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'"
                  placeholder="Auto-calculated (ETB + 3hrs)"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Discharge Time (Hrs) <span class="text-red-500">*</span>
                </label>
                <input
                  v-model.number="formData.dischargeTimeHours"
                  type="number"
                  min="0"
                  step="1"
                  class="h-11 w-full appearance-none rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-hidden focus:ring-3 dark:bg-gray-800 dark:text-white"
                  :class="submittedOnce && !formData.dischargeTimeHours ? 'border-red-500 focus:ring-red-500/20 dark:border-red-600' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800'"
                  placeholder="Enter hours"
                />
              </div>
            </div>

            <!-- ETC (Calculated) -->
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                ETC (Estimated Time of Completion)
              </label>
              <flat-pickr
                v-model="formData.etc"
                :config="dateTimeConfig"
                @on-change="handleEtcChange"
                class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-800"
                placeholder="Select date and time"
              />
            </div>

            <!-- Cargo -->
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Cargo <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.cargo"
                type="text"
                readonly
                class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                placeholder="Desde Ship Nomination"
              />
            </div>

            <!-- Surveyor -->
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Surveyor <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.surveyor"
                type="text"
                readonly
                class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                placeholder="Desde Ship Nomination"
              />
            </div>

            <!-- Row: Pre Discharge Testing + Post Discharge Testing -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Pre Discharge Testing
                </label>
                <input
                  v-model="formData.preDischargeTest"
                  type="text"
                  readonly
                  class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  placeholder="From Ship Nomination (Chemist)"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Post Discharge Testing
                </label>
                <input
                  v-model="formData.postDischargeTest"
                  type="text"
                  readonly
                  class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  placeholder="From Ship Nomination (Chemist)"
                />
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end">
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="handleSubmit"
                  :disabled="isSubmitting || !hasLineSamplingGenerated"
                  class="rounded-lg bg-brand-500 px-6 py-2.5 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isEditing && hasUnsavedChanges ? 'Update' : isEditing ? 'Saved' : 'Save' }}
                </button>
                <button
                  v-if="isEditing"
                  type="button"
                  class="rounded-lg bg-orange-500 px-6 py-2.5 text-white font-medium hover:bg-orange-600"
                  @click="cancelEdit"
                >
                  Cancel Edit
                </button>
                <button
                  type="button"
                  class="rounded-lg bg-gray-200 px-6 py-2.5 text-gray-900 font-medium hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
                  @click="resetForm"
                >
                  Reset
                </button>
              </div>
            </div>

          </form>
        </div>
      </ComponentCard>

      <!-- Right: Office Sampling -->
      <ComponentCard title="Roster" description="Sampling roster schedule" class="lg:col-span-3">
        <div class="p-6">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Office Sampling</h4>
          
          <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Who</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">START OFFICE</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">FINISH SAMPLING</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">HOURS</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                <tr v-if="officeSamplingData.length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td colspan="5" class="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">No data available. Select a vessel to populate the table.</td>
                </tr>
                <tr
                  v-for="(record, index) in officeSamplingData"
                  :key="`office-${index}-${record.startOfficeRaw}`"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <!-- Who -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <select
                      v-if="editingIndex === index"
                      v-model="editingData.who"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                    >
                      <option value="">Select sampler</option>
                      <option v-for="sampler in samplerOptions" :key="sampler" :value="sampler">{{ sampler }}</option>
                    </select>
                    <span v-else class="block">{{ record.who || '-' }}</span>
                  </td>
                  
                  <!-- START OFFICE -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div v-show="editingIndex === index">
                      <flat-pickr
                        :key="`start-${index}`"
                        v-model="editingData.startOffice"
                        :config="dateTimeConfig"
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                      />
                    </div>
                    <span v-show="editingIndex !== index">{{ record.startOffice || '-' }}</span>
                  </td>
                  
                  <!-- FINISH SAMPLING -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div v-show="editingIndex === index">
                      <flat-pickr
                        :key="`finish-${index}`"
                        v-model="editingData.finishSampling"
                        :config="dateTimeConfig"
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                      />
                    </div>
                    <span v-show="editingIndex !== index">{{ record.finishSampling || '-' }}</span>
                  </td>
                  
                  <!-- HOURS -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <span v-if="editingIndex === index">{{ calculateEditingHours }}</span>
                    <span v-else>{{ record.hours || '-' }}</span>
                  </td>
                  
                  <!-- ACTIONS -->
                  <td class="whitespace-nowrap px-6 py-4 text-sm">
                    <div v-if="editingIndex === index" class="flex items-center gap-2">
                      <button
                        @click="saveEdit(index)"
                        class="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-all duration-200"
                        title="Save"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        @click="cancelOfficeSamplingEdit"
                        class="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
                        title="Cancel"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <button
                      v-else
                      @click="startEdit(index)"
                      class="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200"
                      title="Edit"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Line Sampling Table -->
          <div class="mt-6 mb-4 flex items-center justify-between">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">Line Sampling</h4>
            <div class="flex gap-2">
              <button
                v-if="lineSamplingData.length > 0"
                type="button"
                @click="clearLineSampling"
                class="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                @click="handleAutoGenerate"
                :disabled="isGenerating || !formData.startDischarge || !formData.dischargeTimeHours"
                class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ isGenerating ? 'Generating...' : 'Auto generate' }}
              </button>
            </div>
          </div>
          
          <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Who</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Start</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Finish</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Hours</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                <tr v-if="lineSamplingData.length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td colspan="5" class="px-6 py-4 text-sm text-center text-gray-500 dark:text-gray-400">No data available.</td>
                </tr>
                <tr
                  v-for="(record, index) in lineSamplingData"
                  :key="`line-${index}-${record.startLineSamplingRaw}`"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <!-- Who -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <select
                      v-if="editingLineIndex === index"
                      v-model="editingLineData.who"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                    >
                      <option value="">Select sampler</option>
                      <option v-for="sampler in samplerOptions" :key="sampler" :value="sampler">{{ sampler }}</option>
                    </select>
                    <span v-else class="block">{{ record.who || '-' }}</span>
                  </td>
                  
                  <!-- Start Line Sampling -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div v-show="editingLineIndex === index">
                      <flat-pickr
                        :key="`start-line-${index}`"
                        v-model="editingLineData.startLineSampling"
                        :config="dateTimeConfig"
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                      />
                    </div>
                    <span v-show="editingLineIndex !== index">{{ record.startLineSampling || '-' }}</span>
                  </td>
                  
                  <!-- Finish Line Sampling -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div v-show="editingLineIndex === index">
                      <flat-pickr
                        :key="`finish-line-${index}`"
                        v-model="editingLineData.finishLineSampling"
                        :config="dateTimeConfig"
                        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-800"
                      />
                    </div>
                    <span v-show="editingLineIndex !== index">{{ record.finishLineSampling || '-' }}</span>
                  </td>
                  
                  <!-- Hours -->
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <span v-if="editingLineIndex === index">{{ calculateLineEditingHours }}</span>
                    <span v-else>{{ record.hours || '-' }}</span>
                  </td>
                  
                  <!-- ACTIONS -->
                  <td class="whitespace-nowrap px-6 py-4 text-sm">
                    <div v-if="editingLineIndex === index" class="flex items-center gap-2">
                      <button
                        @click="saveLineEdit(index)"
                        class="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-all duration-200"
                        title="Save"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        @click="cancelLineSamplingEdit"
                        class="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
                        title="Cancel"
                      >
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <button
                      v-else
                      @click="startLineEdit(index)"
                      class="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-200"
                      title="Edit"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>
    </div>

  </AdminLayout>

  <!-- Confirmation Modal for Clearing Line Sampling -->
  <ConfirmationModal
    :isOpen="showClearConfirmModal"
    title="Clear Line Sampling?"
    message="Are you sure you want to clear all Line Sampling shifts? This action cannot be undone."
    variant="warning"
    confirmText="Clear All"
    @confirm="confirmClearLineSampling"
    @close="showClearConfirmModal = false"
  />

  <!-- Sampler Conflict Modal -->
  <SamplerConflictModal
    :isOpen="showConflictModal"
    :conflictData="conflictModalData"
    @override="handleConflictOverride"
    @close="showConflictModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useToast } from 'vue-toastification'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import ConfirmationModal from '@/components/ui/ConfirmationModal.vue'
import SamplerConflictModal from '@/components/ui/SamplerConflictModal.vue'
import { getAllShipNominations, searchShipNominations, checkAmspecReference, updateShipNomination, type ShipNomination, type ShipNominationData } from '@/services/shipNominationService'
import dropdownService, { type Terminal } from '@/services/dropdownService'
import { autogenerateLineSampling, getSamplingRosterByRef, createSamplingRoster, updateSamplingRoster, upsertSamplingRoster, type SamplingRosterData as SamplingRosterDataService } from '@/services/samplingRosterService'
import { listMolekulisLoadings, type MolekulisLoading } from '@/services/molekulisLoadingService'
import { listOtherJobs, type OtherJob } from '@/services/otherJobsService'

const toast = useToast()

// Ship Nomination Search
const searchQuery = ref('')
const showDropdown = ref(false)
const isLoadingShips = ref(false)
const shipNominations = ref<ShipNomination[]>([])
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

// Show filtered results (from loaded data)
const filteredShipNominations = computed(() => {
  return shipNominations.value
})

// Load initial ship nominations (only last 5)
const loadInitialShipNominations = async () => {
  isLoadingShips.value = true
  try {
    const response = await getAllShipNominations({ limit: 5, sortBy: 'etb', sortOrder: 'desc' })
    if (response.success && response.data) {
      shipNominations.value = response.data
    }
  } catch (error) {
    console.error('Error loading ship nominations:', error)
  } finally {
    isLoadingShips.value = false
  }
}

// Search ship nominations with debounce
const handleSearch = async () => {
  showDropdown.value = true

  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  // If search query is empty, load only last 5
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    await loadInitialShipNominations()
    return
  }

  // Debounce search: wait 500ms after user stops typing
  searchTimeout.value = setTimeout(async () => {
    isLoadingShips.value = true
    try {
      const response = await searchShipNominations(searchQuery.value, 20)
      if (response.success && response.data) {
        shipNominations.value = response.data
      }
    } catch (error) {
      console.error('Error searching ship nominations:', error)
      toast.error('Error searching ship nominations')
    } finally {
      isLoadingShips.value = false
    }
  }, 500) // 500ms debounce
}

// Office Sampling Data Interface
interface OfficeSamplingRecord {
  who: string
  startOffice: string // Display formatted
  startOfficeRaw: string // ISO format for editing
  finishSampling: string // Display formatted
  finishSamplingRaw: string // ISO format for editing
  hours: string
}

// Office Sampling Data
const officeSamplingData = ref<OfficeSamplingRecord[]>([])
const editingIndex = ref<number | null>(null)
const editingData = ref<{
  who: string
  startOffice: string
  finishSampling: string
  hours: string
}>({
  who: '',
  startOffice: '',
  finishSampling: '',
  hours: ''
})

// Line Sampling Data Interface
interface LineSamplingRecord {
  who: string
  startLineSampling: string // Display formatted
  startLineSamplingRaw: string // ISO format for editing
  finishLineSampling: string // Display formatted
  finishLineSamplingRaw: string // ISO format for editing
  hours: string
}

// Line Sampling Data
const lineSamplingData = ref<LineSamplingRecord[]>([])
const editingLineIndex = ref<number | null>(null)
const editingLineData = ref<{
  who: string
  startLineSampling: string
  finishLineSampling: string
  hours: string
}>({
  who: '',
  startLineSampling: '',
  finishLineSampling: '',
  hours: ''
})

// Sampler options for dropdown
const samplerOptions = ref<string[]>([])

// Complete sampler data for validation (cached from API)
interface SamplerData {
  _id: string
  name: string
  email?: string
  isActive: boolean
  has24HourRestriction?: boolean
  restrictedDays?: number[]
}
const samplersData = ref<SamplerData[]>([])

// Format date/time for display (24 hour format)
const formatDateTimeForTable = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  const year = d.getFullYear()
  const month = d.toLocaleString('en-US', { month: 'short' })
  const day = d.getDate()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month} ${day}, ${year} ${hours}:${minutes}`
}

// Format date/time for flatpickr input (Y-m-d H:i)
const formatDateTimeForInput = (dateString: string) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// Calculate hours between two dates
const calculateHours = (startDate: Date, finishDate: Date) => {
  const diffMs = finishDate.getTime() - startDate.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours.toFixed(2)
}

// Calculate hours in real-time during editing (reactive function)
const calculateEditingHours = computed(() => {
  if (editingIndex.value === null) {
    return null
  }

  if (!editingData.value.startOffice || !editingData.value.finishSampling) {
    return '-'
  }

  const startDate = new Date(editingData.value.startOffice)
  const finishDate = new Date(editingData.value.finishSampling)

  if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
    return '-'
  }

  if (finishDate <= startDate) {
    return '0.00 hrs'
  }

  const hours = calculateHours(startDate, finishDate)
  return `${hours} hrs`
})

// Calculate hours in real-time during Line Sampling editing (reactive function)
const calculateLineEditingHours = computed(() => {
  if (editingLineIndex.value === null) {
    return null
  }

  if (!editingLineData.value.startLineSampling || !editingLineData.value.finishLineSampling) {
    return '-'
  }

  const startDate = new Date(editingLineData.value.startLineSampling)
  const finishDate = new Date(editingLineData.value.finishLineSampling)

  if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
    return '-'
  }

  if (finishDate <= startDate) {
    return '0.00 hrs'
  }

  const hours = calculateHours(startDate, finishDate)
  return `${hours} hrs`
})

// Populate Office Sampling table from ship nomination
const populateOfficeSamplingTable = (ship: ShipNomination) => {
  if (!ship.sampler || !ship.pilotOnBoard) {
    officeSamplingData.value = []
    return
  }

  // START OFFICE: Pilot on Board
  const startOfficeDate = new Date(ship.pilotOnBoard)

  // FINISH SAMPLING: Pilot on Board + 5 hours
  const finishSamplingDate = new Date(startOfficeDate.getTime() + (5 * 60 * 60 * 1000))

  // HOURS: Calculate difference
  const hours = calculateHours(startOfficeDate, finishSamplingDate)

  // Create new array to ensure reactivity
  officeSamplingData.value = [{
    who: ship.sampler,
    startOffice: formatDateTimeForTable(ship.pilotOnBoard),
    startOfficeRaw: startOfficeDate.toISOString(),
    finishSampling: formatDateTimeForTable(finishSamplingDate.toISOString()),
    finishSamplingRaw: finishSamplingDate.toISOString(),
    hours: `${hours} hrs`
  }]
}


// Start editing a record
const startEdit = (index: number) => {
  const record = officeSamplingData.value[index]
  editingIndex.value = index
  editingData.value = {
    who: record.who,
    startOffice: formatDateTimeForInput(record.startOfficeRaw),
    finishSampling: formatDateTimeForInput(record.finishSamplingRaw),
    hours: record.hours
  }
}

// Save edited record
const saveEdit = async (index: number) => {
  const currentRecord = officeSamplingData.value[index]
  
  // Use existing dates if not provided in editing data
  let startDate: Date
  let finishDate: Date
  
  if (editingData.value.startOffice) {
    startDate = new Date(editingData.value.startOffice)
    if (isNaN(startDate.getTime())) {
      toast.warning('Invalid START OFFICE date format')
      return
    }
  } else {
    // Use existing date if not changed
    startDate = new Date(currentRecord.startOfficeRaw)
  }
  
  if (editingData.value.finishSampling) {
    finishDate = new Date(editingData.value.finishSampling)
    if (isNaN(finishDate.getTime())) {
      toast.warning('Invalid FINISH SAMPLING date format')
      return
    }
  } else {
    // Use existing date if not changed
    finishDate = new Date(currentRecord.finishSamplingRaw)
  }

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
    toast.warning('Please fill in START OFFICE and FINISH SAMPLING')
    return
  }

  if (finishDate <= startDate) {
    toast.warning('FINISH SAMPLING must be after START OFFICE')
    return
  }

  // Calculate hours automatically
  const hours = calculateHours(startDate, finishDate)

  // Update the record with new array to ensure Vue reactivity
  const updatedRecord = {
    who: editingData.value.who || currentRecord.who,
    startOffice: formatDateTimeForTable(startDate.toISOString()),
    startOfficeRaw: startDate.toISOString(),
    finishSampling: formatDateTimeForTable(finishDate.toISOString()),
    finishSamplingRaw: finishDate.toISOString(),
    hours: `${hours} hrs`
  }

  // Create new array with updated record
  const newOfficeSamplingData = [...officeSamplingData.value]
  newOfficeSamplingData[index] = updatedRecord
  officeSamplingData.value = newOfficeSamplingData

  // Exit edit mode
  editingIndex.value = null
  editingData.value = {
    who: '',
    startOffice: '',
    finishSampling: '',
    hours: ''
  }
  
  // Auto-save after editing (only officeSampling field will be sent)
  if (hasLineSamplingGenerated.value) {
    await autoSave()
  }
  
  toast.success('Record updated successfully')
}

// Cancel editing Office Sampling
const cancelOfficeSamplingEdit = () => {
  editingIndex.value = null
  editingData.value = {
    who: '',
    startOffice: '',
    finishSampling: '',
    hours: ''
  }
}

// Start editing a Line Sampling record
const startLineEdit = (index: number) => {
  const record = lineSamplingData.value[index]
  editingLineIndex.value = index
  editingLineData.value = {
    who: record.who,
    startLineSampling: formatDateTimeForInput(record.startLineSamplingRaw),
    finishLineSampling: formatDateTimeForInput(record.finishLineSamplingRaw),
    hours: record.hours
  }
}

// Calculate hours between two dates (returns number)
const calculateHoursNumber = (startDate: Date, finishDate: Date): number => {
  const diffMs = finishDate.getTime() - startDate.getTime()
  return diffMs / (1000 * 60 * 60)
}

// Check if two shifts overlap
const doShiftsOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
  return start1 < end2 && start2 < end1
}

// Validate that edited shift doesn't overlap with other shifts
const validateShiftOverlap = (index: number, newStart: Date, newFinish: Date): boolean => {
  for (let i = 0; i < lineSamplingData.value.length; i++) {
    if (i === index) continue // Skip the current shift being edited
    
    const otherShift = lineSamplingData.value[i]
    if (!otherShift.startLineSamplingRaw || !otherShift.finishLineSamplingRaw) continue
    
    const otherStart = new Date(otherShift.startLineSamplingRaw)
    const otherFinish = new Date(otherShift.finishLineSamplingRaw)
    
    if (doShiftsOverlap(newStart, newFinish, otherStart, otherFinish)) {
      return false
    }
  }
  return true
}

// Calculate adjusted subsequent shifts without applying them (for validation)
const calculateAdjustedSubsequentShifts = async (index: number, newFinishTime: Date): Promise<LineSamplingRecord[]> => {
  if (index >= lineSamplingData.value.length - 1) {
    return [] // No subsequent shifts to adjust
  }
  
  // Get ETC (end of discharge period) for adjusting last shift
  let etcDate: Date | null = null
  if (formData.value.startDischarge && formData.value.dischargeTimeHours) {
    let startDischargeISO: string
    if (formData.value.startDischarge.includes('T') || formData.value.startDischarge.includes('Z')) {
      startDischargeISO = formData.value.startDischarge
    } else {
      const startDate = new Date(formData.value.startDischarge.replace(' ', 'T'))
      startDischargeISO = startDate.toISOString()
    }
    const startDischargeDate = new Date(startDischargeISO)
    etcDate = new Date(startDischargeDate.getTime() + formData.value.dischargeTimeHours * 60 * 60 * 1000)
  }
  
  let currentStart = new Date(newFinishTime)
  const adjustedShifts: LineSamplingRecord[] = []
  
  // Calculate all subsequent shifts
  for (let i = index + 1; i < lineSamplingData.value.length; i++) {
    const currentShift = lineSamplingData.value[i]
    
    // Check if we've already reached ETC before starting this shift
    if (etcDate && currentStart >= etcDate) {
      break
    }
    
    // Calculate new shift end (12 hours from start)
    let newShiftEnd = new Date(currentStart.getTime() + 12 * 60 * 60 * 1000)
    
    // Check if end time would exceed ETC
    if (etcDate && newShiftEnd > etcDate) {
      newShiftEnd = etcDate
    }
    
    const shiftHours = calculateHoursNumber(currentStart, newShiftEnd)
    
    adjustedShifts.push({
      who: currentShift.who,
      startLineSampling: formatDateTimeForTable(currentStart.toISOString()),
      startLineSamplingRaw: currentStart.toISOString(),
      finishLineSampling: formatDateTimeForTable(newShiftEnd.toISOString()),
      finishLineSamplingRaw: newShiftEnd.toISOString(),
      hours: `${shiftHours.toFixed(2)} hrs`
    })
    
    // Move to next shift start
    currentStart = new Date(newShiftEnd)
    
    // If we've reached ETC (shift ends exactly at ETC or beyond), stop adjusting
    if (etcDate && newShiftEnd >= etcDate) {
      break
    }
  }
  
  // After adjusting existing shifts, check if we need to add more shifts to reach ETC
  if (etcDate && currentStart < etcDate) {
    // Generate additional shifts until we reach ETC
    // Get the samplers list from cached data
    const availableSamplers: string[] = samplersData.value
      .filter((s: SamplerData) => s.isActive)
      .map((s: SamplerData) => s.name)
    
    if (availableSamplers.length > 0) {
      // Get used samplers from existing shifts (excluding the one being edited)
      const usedSamplers: string[] = []
      for (let i = 0; i <= index; i++) {
        if (lineSamplingData.value[i].who) {
          usedSamplers.push(lineSamplingData.value[i].who)
        }
      }
      for (const shift of adjustedShifts) {
        if (shift.who) {
          usedSamplers.push(shift.who)
        }
      }
      
      // Rotate samplers for new shifts (start with least used)
      const samplerUsage = new Map<string, number>()
      availableSamplers.forEach((name: string) => {
        samplerUsage.set(name, usedSamplers.filter(s => s === name).length)
      })
      
      // Sort by usage (least used first)
      const sortedSamplers = [...availableSamplers].sort((a, b) => {
        return (samplerUsage.get(a) || 0) - (samplerUsage.get(b) || 0)
      })
      
      let samplerIndex = 0
      
      // Generate shifts until ETC
      while (currentStart < etcDate) {
        // Calculate shift end (12 hours or until ETC)
        let newShiftEnd = new Date(currentStart.getTime() + 12 * 60 * 60 * 1000)
        if (newShiftEnd > etcDate) {
          newShiftEnd = etcDate
        }
        
        const shiftHours = calculateHoursNumber(currentStart, newShiftEnd)
        
        // Assign sampler (rotate through available samplers)
        const assignedSampler = sortedSamplers[samplerIndex % sortedSamplers.length]
        
        adjustedShifts.push({
          who: assignedSampler,
          startLineSampling: formatDateTimeForTable(currentStart.toISOString()),
          startLineSamplingRaw: currentStart.toISOString(),
          finishLineSampling: formatDateTimeForTable(newShiftEnd.toISOString()),
          finishLineSamplingRaw: newShiftEnd.toISOString(),
          hours: `${shiftHours.toFixed(2)} hrs`
        })
        
        // Update sampler usage
        samplerUsage.set(assignedSampler, (samplerUsage.get(assignedSampler) || 0) + 1)
        samplerIndex++
        
        // Move to next shift start
        currentStart = new Date(newShiftEnd)
        
        // If we've reached ETC, stop
        if (currentStart >= etcDate) {
          break
        }
      }
    }
  }
  
  return adjustedShifts
}

// Get week range (Monday 00:00 to Sunday 23:59) for a given date
const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { start: monday, end: sunday }
}

// Check if any part of a shift falls on a restricted day
const hasRestrictedDay = (shiftStart: Date, shiftEnd: Date, restrictedDays: number[]): boolean => {
  const start = new Date(shiftStart)
  const end = new Date(shiftEnd)
  
  // Check each day the shift spans
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const checkDate = new Date(current)
  
  while (checkDate <= end) {
    const dayOfWeek = checkDate.getDay() // 0 = Sunday, 6 = Saturday
    if (restrictedDays.includes(dayOfWeek)) {
      return true
    }
    checkDate.setDate(checkDate.getDate() + 1)
  }
  
  return false
}

// Validate shifts don't overlap (including calculated adjusted shifts)
const validateShiftsAfterAdjustment = (
  editedIndex: number,
  newStart: Date,
  newFinish: Date,
  adjustedShifts: LineSamplingRecord[]
): boolean => {
  // Check edited shift against all other shifts (excluding subsequent ones that will be adjusted)
  for (let i = 0; i < lineSamplingData.value.length; i++) {
    if (i === editedIndex || i > editedIndex) continue // Skip edited shift and subsequent shifts (they'll be adjusted)
    
    const otherShift = lineSamplingData.value[i]
    if (!otherShift.startLineSamplingRaw || !otherShift.finishLineSamplingRaw) continue
    
    const otherStart = new Date(otherShift.startLineSamplingRaw)
    const otherFinish = new Date(otherShift.finishLineSamplingRaw)
    
    if (doShiftsOverlap(newStart, newFinish, otherStart, otherFinish)) {
      return false
    }
  }
  
  // Check adjusted shifts against each other and against previous shifts
  for (let i = 0; i < adjustedShifts.length; i++) {
    const adjustedShift = adjustedShifts[i]
    const adjStart = new Date(adjustedShift.startLineSamplingRaw)
    const adjFinish = new Date(adjustedShift.finishLineSamplingRaw)
    
    // Check against edited shift
    if (doShiftsOverlap(adjStart, adjFinish, newStart, newFinish)) {
      return false
    }
    
    // Check against other adjusted shifts
    for (let j = i + 1; j < adjustedShifts.length; j++) {
      const otherAdjShift = adjustedShifts[j]
      const otherAdjStart = new Date(otherAdjShift.startLineSamplingRaw)
      const otherAdjFinish = new Date(otherAdjShift.finishLineSamplingRaw)
      
      if (doShiftsOverlap(adjStart, adjFinish, otherAdjStart, otherAdjFinish)) {
        return false
      }
    }
    
    // Check against previous shifts (before edited one)
    for (let j = 0; j < editedIndex; j++) {
      const prevShift = lineSamplingData.value[j]
      if (!prevShift.startLineSamplingRaw || !prevShift.finishLineSamplingRaw) continue
      
      const prevStart = new Date(prevShift.startLineSamplingRaw)
      const prevFinish = new Date(prevShift.finishLineSamplingRaw)
      
      if (doShiftsOverlap(adjStart, adjFinish, prevStart, prevFinish)) {
        return false
      }
    }
  }
  
  return true
}

// Validation state for preventing concurrent calls
const isValidatingSampler = ref(false)

// Cache for external module data to reduce API calls
interface ValidationCacheData {
  molekulisData: MolekulisLoading[] | null | undefined
  otherJobsData: OtherJob[] | null | undefined
  lastFetch: number
  CACHE_DURATION: number
}

const validationCache = ref<ValidationCacheData>({
  molekulisData: null,
  otherJobsData: null,
  lastFetch: 0,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes cache
})

// Validate sampler restrictions for manual edits (same rules as autogenerate)
const validateSamplerRestrictions = async (
  samplerName: string,
  shiftStart: Date,
  shiftEnd: Date,
  excludeIndex?: number // Index of shift being edited to exclude from conflicts
): Promise<{ 
  valid: boolean
  reason?: string
  conflictDetails?: {
    previousShift?: {
      start: Date
      end: Date
      duration: string
      source: string
    }
    restHours?: number
    weeklyHoursDetails?: {
      currentHours: number
      proposedHours: number
      totalHours: number
      maxHours: number
      existingShifts: Array<{
        start: Date
        end: Date
        duration: number
        source: string
      }>
    }
  }
}> => {
  // Prevent concurrent validation requests
  if (isValidatingSampler.value) {
    return { valid: false, reason: 'Validation already in progress' }
  }

  isValidatingSampler.value = true

  // Get sampler details from cached data (loaded in onMounted)
  const sampler = samplersData.value.find((s: SamplerData) => s.name === samplerName)
  if (!sampler) {
    isValidatingSampler.value = false
    return { valid: false, reason: 'Sampler not found' }
  }

  // Check if sampler is active
  if (!sampler.isActive) {
    isValidatingSampler.value = false
    return { valid: false, reason: 'Sampler is inactive' }
  }

  // Check restricted days
  if (hasRestrictedDay(shiftStart, shiftEnd, sampler.restrictedDays || [])) {
    const restrictedDays = (sampler.restrictedDays || []).map((d: number) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[d]
    }).join(', ')
    isValidatingSampler.value = false
    return { valid: false, reason: `Cannot work on restricted days: ${restrictedDays}` }
  }

  isValidatingSampler.value = false

  // Check for consecutive shifts (same sampler without minimum rest) and overlaps
  const MIN_REST_HOURS = 10
  for (let i = 0; i < lineSamplingData.value.length; i++) {
    if (i === excludeIndex) continue // Skip the shift being edited
    
    const otherShift = lineSamplingData.value[i]
    if (!otherShift.who || otherShift.who !== samplerName) continue
    if (!otherShift.startLineSamplingRaw || !otherShift.finishLineSamplingRaw) continue
    
    const otherStart = new Date(otherShift.startLineSamplingRaw)
    const otherFinish = new Date(otherShift.finishLineSamplingRaw)
    
    // Check if shifts overlap (sampler is in another shift at the same time)
    if (doShiftsOverlap(shiftStart, shiftEnd, otherStart, otherFinish)) {
      const previousShiftDuration = calculateHoursNumber(otherStart, otherFinish)
      return {
        valid: false,
        reason: `Sampler is already assigned to another shift during this time`,
        conflictDetails: {
          previousShift: {
            start: otherStart,
            end: otherFinish,
            duration: `${previousShiftDuration.toFixed(1)}h`,
            source: 'Line Sampling'
          }
        }
      }
    }
    
    // Check if this shift comes before or after the edited shift
    let restHours: number
    
    if (shiftStart >= otherFinish) {
      // Edited shift starts after other shift ends
      restHours = calculateHoursNumber(otherFinish, shiftStart)
    } else if (otherStart >= shiftEnd) {
      // Other shift starts after edited shift ends
      restHours = calculateHoursNumber(shiftEnd, otherStart)
    } else {
      // Already handled overlap case above
      continue
    }
    
    // If shifts are consecutive (one ends exactly when the other starts or very close)
    // and rest is less than minimum, it's invalid
    if (restHours < MIN_REST_HOURS) {
      const previousShiftDuration = calculateHoursNumber(otherStart, otherFinish)
      return {
        valid: false,
        reason: `Insufficient rest between shifts: ${restHours.toFixed(1)}h (minimum ${MIN_REST_HOURS}h required)`,
        conflictDetails: {
          previousShift: {
            start: otherStart,
            end: otherFinish,
            duration: `${previousShiftDuration.toFixed(1)}h`,
            source: 'Line Sampling'
          },
          restHours: restHours
        }
      }
    }
  }
  
  // Check weekly hours limit (if restricted)
  const WEEKLY_MAX_HOURS_24 = 24
  if (sampler.has24HourRestriction) {
    const weekRange = getWeekRange(shiftStart)
    
    // Collect all shifts for this week to show in modal
    const existingShifts: Array<{
      start: Date
      end: Date
      duration: number
      source: string
    }> = []
    
    // Calculate weekly hours from all shifts (including this one)
    const proposedShiftHours = calculateHoursNumber(shiftStart, shiftEnd)
    let currentWeeklyHours = 0
    
    // Collect shifts from Line Sampling
    for (let i = 0; i < lineSamplingData.value.length; i++) {
      if (i === excludeIndex) continue
      
      const otherShift = lineSamplingData.value[i]
      if (!otherShift.who || otherShift.who !== samplerName) continue
      if (!otherShift.startLineSamplingRaw || !otherShift.finishLineSamplingRaw) continue
      
      const otherStart = new Date(otherShift.startLineSamplingRaw)
      const otherFinish = new Date(otherShift.finishLineSamplingRaw)
      
      // Only count hours within the same week
      const shiftWeekRange = getWeekRange(otherStart)
      if (shiftWeekRange.start.getTime() === weekRange.start.getTime()) {
        const overlapStart = new Date(Math.max(otherStart.getTime(), weekRange.start.getTime()))
        const overlapEnd = new Date(Math.min(otherFinish.getTime(), weekRange.end.getTime()))
        if (overlapStart < overlapEnd) {
          const hours = calculateHoursNumber(overlapStart, overlapEnd)
          currentWeeklyHours += hours
          existingShifts.push({
            start: otherStart,
            end: otherFinish,
            duration: hours,
            source: 'Line Sampling'
          })
        }
      }
    }
    
    // Also check conflicts from other modules (use cache to reduce API calls)
    try {
      const weekStart = weekRange.start
      const weekEnd = weekRange.end
      const now = Date.now()

      // Check if cache is still valid
      if (!validationCache.value.molekulisData ||
          !validationCache.value.otherJobsData ||
          (now - validationCache.value.lastFetch) > validationCache.value.CACHE_DURATION) {

        // Fetch Molekulis conflicts (only if cache expired) - optimized with pagination
        const [molekulisResponse, otherJobsResponse] = await Promise.all([
          listMolekulisLoadings({ limit: 100, sortBy: 'startAt', sortOrder: 'asc' }),
          listOtherJobs({ limit: 100, sortBy: 'startAt', sortOrder: 'asc' })
        ])

        // Update cache
        validationCache.value.molekulisData = molekulisResponse.success ? molekulisResponse.data : []
        validationCache.value.otherJobsData = otherJobsResponse.success ? otherJobsResponse.data : []
        validationCache.value.lastFetch = now
      }

      // Check Molekulis conflicts from cache
      if (validationCache.value.molekulisData) {
        for (const item of validationCache.value.molekulisData) {
          if (item.who === samplerName) {
            const itemStart = new Date(item.startAt)
            const itemEnd = new Date(item.endAt)

            if (doShiftsOverlap(weekStart, weekEnd, itemStart, itemEnd)) {
              const overlapStart = new Date(Math.max(itemStart.getTime(), weekStart.getTime()))
              const overlapEnd = new Date(Math.min(itemEnd.getTime(), weekEnd.getTime()))
              if (overlapStart < overlapEnd) {
                const hours = calculateHoursNumber(overlapStart, overlapEnd)
                currentWeeklyHours += hours
                existingShifts.push({
                  start: itemStart,
                  end: itemEnd,
                  duration: hours,
                  source: 'Molekulis Loading'
                })
              }
            }
          }
        }
      }

      // Check Other Jobs conflicts from cache
      if (validationCache.value.otherJobsData) {
        for (const item of validationCache.value.otherJobsData) {
          if (item.who === samplerName) {
            const itemStart = new Date(item.startAt)
            const itemEnd = new Date(item.endAt)

            if (doShiftsOverlap(weekStart, weekEnd, itemStart, itemEnd)) {
              const overlapStart = new Date(Math.max(itemStart.getTime(), weekStart.getTime()))
              const overlapEnd = new Date(Math.min(itemEnd.getTime(), weekEnd.getTime()))
              if (overlapStart < overlapEnd) {
                const hours = calculateHoursNumber(overlapStart, overlapEnd)
                currentWeeklyHours += hours
                existingShifts.push({
                  start: itemStart,
                  end: itemEnd,
                  duration: hours,
                  source: 'Other Jobs'
                })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conflicts for weekly hours validation:', error)
    }
    
    const totalWeeklyHours = currentWeeklyHours + proposedShiftHours
    
    if (totalWeeklyHours > WEEKLY_MAX_HOURS_24) {
      return {
        valid: false,
        reason: `Weekly limit exceeded: ${totalWeeklyHours.toFixed(1)}h (max ${WEEKLY_MAX_HOURS_24}h)`,
        conflictDetails: {
          weeklyHoursDetails: {
            currentHours: currentWeeklyHours,
            proposedHours: proposedShiftHours,
            totalHours: totalWeeklyHours,
            maxHours: WEEKLY_MAX_HOURS_24,
            existingShifts: existingShifts
          }
        }
      }
    }
  }
  
  // Check conflicts with other modules (use cache to reduce API calls)
  try {
    // Ensure cache is populated
    const now = Date.now()
    if (!validationCache.value.molekulisData ||
        !validationCache.value.otherJobsData ||
        (now - validationCache.value.lastFetch) > validationCache.value.CACHE_DURATION) {

      const [molekulisResponse, otherJobsResponse] = await Promise.all([
        listMolekulisLoadings({ limit: 100, sortBy: 'startAt', sortOrder: 'asc' }),
        listOtherJobs({ limit: 100, sortBy: 'startAt', sortOrder: 'asc' })
      ])

      validationCache.value.molekulisData = molekulisResponse.success ? molekulisResponse.data : []
      validationCache.value.otherJobsData = otherJobsResponse.success ? otherJobsResponse.data : []
      validationCache.value.lastFetch = now
    }

    // Check Molekulis conflicts from cache
    if (validationCache.value.molekulisData) {
      for (const item of validationCache.value.molekulisData) {
        if (item.who === samplerName) {
          const itemStart = new Date(item.startAt)
          const itemEnd = new Date(item.endAt)

          if (doShiftsOverlap(shiftStart, shiftEnd, itemStart, itemEnd)) {
            const duration = calculateHoursNumber(itemStart, itemEnd)
            return {
              valid: false,
              reason: 'Conflicts with Molekulis assignment',
              conflictDetails: {
                previousShift: {
                  start: itemStart,
                  end: itemEnd,
                  duration: `${duration.toFixed(1)}h`,
                  source: 'Molekulis Loading'
                }
              }
            }
          }
        }
      }
    }

    // Check Other Jobs conflicts from cache
    if (validationCache.value.otherJobsData) {
      for (const item of validationCache.value.otherJobsData) {
        if (item.who === samplerName) {
          const itemStart = new Date(item.startAt)
          const itemEnd = new Date(item.endAt)

          if (doShiftsOverlap(shiftStart, shiftEnd, itemStart, itemEnd)) {
            const duration = calculateHoursNumber(itemStart, itemEnd)
            return {
              valid: false,
              reason: 'Conflicts with Other Jobs assignment',
              conflictDetails: {
                previousShift: {
                  start: itemStart,
                  end: itemEnd,
                  duration: `${duration.toFixed(1)}h`,
                  source: 'Other Jobs'
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking conflicts:', error)
  }

  return { valid: true }
}

// Save edited Line Sampling record
const saveLineEdit = async (index: number) => {
  const currentRecord = lineSamplingData.value[index]

  // Use existing dates if not provided in editing data
  let startDate: Date
  let finishDate: Date

  if (editingLineData.value.startLineSampling) {
    startDate = new Date(editingLineData.value.startLineSampling)
    if (isNaN(startDate.getTime())) {
      toast.warning('Invalid Start Line Sampling date format')
      return
    }
  } else {
    // Use existing date if not changed
    startDate = new Date(currentRecord.startLineSamplingRaw)
  }

  if (editingLineData.value.finishLineSampling) {
    finishDate = new Date(editingLineData.value.finishLineSampling)
    if (isNaN(finishDate.getTime())) {
      toast.warning('Invalid Finish Line Sampling date format')
      return
    }
  } else {
    // Use existing date if not changed
    finishDate = new Date(currentRecord.finishLineSamplingRaw)
  }

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(finishDate.getTime())) {
    toast.warning('Please fill in Start Line Sampling and Finish Line Sampling')
    return
  }

  if (finishDate <= startDate) {
    toast.warning('Finish Line Sampling must be after Start Line Sampling')
    return
  }

  // Get sampler name (from editing data or current record)
  const samplerName = editingLineData.value.who || currentRecord.who

  // Validate sampler restrictions (same rules as autogenerate)
  if (samplerName) {
    const restrictionValidation = await validateSamplerRestrictions(
      samplerName,
      startDate,
      finishDate,
      index
    )

    if (!restrictionValidation.valid) {
      // If conflict details are available, show override modal
      if (restrictionValidation.conflictDetails) {
        const proposedDuration = calculateHoursNumber(startDate, finishDate)
        conflictModalData.value = {
          samplerName: samplerName,
          reason: restrictionValidation.reason || 'Sampler validation failed',
          previousShift: restrictionValidation.conflictDetails.previousShift,
          proposedShift: {
            start: startDate,
            end: finishDate,
            duration: `${proposedDuration.toFixed(1)}h`
          },
          restHours: restrictionValidation.conflictDetails.restHours,
          weeklyHoursDetails: restrictionValidation.conflictDetails.weeklyHoursDetails
        }
        // Store the action to execute after override
        pendingValidationAction.value = () => {
          // Continue with save after override confirmation
          continueSaveLineEdit(index, startDate, finishDate)
        }
        showConflictModal.value = true
        return
      } else {
        // No conflict details, show error toast
        toast.error(restrictionValidation.reason || 'Sampler validation failed')
        return
      }
    }
  }

  // Continue with save logic
  await continueSaveLineEdit(index, startDate, finishDate)
}

// Handle conflict override
const handleConflictOverride = () => {
  if (pendingValidationAction.value) {
    pendingValidationAction.value()
    pendingValidationAction.value = null
  }
  showConflictModal.value = false
}

// Continue save after override confirmation
const continueSaveLineEdit = async (index: number, startDate: Date, finishDate: Date) => {
  const currentRecord = lineSamplingData.value[index]
  
  // Calculate hours automatically
  const hours = calculateHoursNumber(startDate, finishDate)
  
  // Check if finish time was manually changed
  const originalFinishTime = new Date(currentRecord.finishLineSamplingRaw)
  const finishTimeChanged = finishDate.getTime() !== originalFinishTime.getTime()

  // Calculate adjusted subsequent shifts if finish time changed
  let adjustedShifts: LineSamplingRecord[] = []
  if (finishTimeChanged) {
    adjustedShifts = await calculateAdjustedSubsequentShifts(index, finishDate)

    // Validate no overlap after adjustment
    if (!validateShiftsAfterAdjustment(index, startDate, finishDate, adjustedShifts)) {
      toast.error('This shift overlaps with another shift after adjustment. Please adjust the times.')
      return
    }

    // Validate sampler restrictions for adjusted shifts (without override for subsequent shifts)
    for (let i = 0; i < adjustedShifts.length; i++) {
      const adjustedShift = adjustedShifts[i]
      if (adjustedShift.who) {
        const adjStart = new Date(adjustedShift.startLineSamplingRaw)
        const adjEnd = new Date(adjustedShift.finishLineSamplingRaw)

        const adjValidation = await validateSamplerRestrictions(
          adjustedShift.who,
          adjStart,
          adjEnd,
          index + 1 + i // This shift will be at this index after adjustment
        )

        if (!adjValidation.valid) {
          toast.error(`Shift ${index + 2 + i}: ${adjValidation.reason}`)
          return
        }
      }
    }
  } else {
    // If finish time didn't change, validate normally
    if (!validateShiftOverlap(index, startDate, finishDate)) {
      toast.error('This shift overlaps with another shift. Please adjust the times.')
      return
    }
  }

  // Update the record
  lineSamplingData.value[index] = {
    who: editingLineData.value.who || currentRecord.who,
    startLineSampling: formatDateTimeForTable(startDate.toISOString()),
    startLineSamplingRaw: startDate.toISOString(),
    finishLineSampling: formatDateTimeForTable(finishDate.toISOString()),
    finishLineSamplingRaw: finishDate.toISOString(),
    hours: `${hours.toFixed(2)} hrs`
  }

  // If finish time was manually changed, apply adjusted shifts
  if (finishTimeChanged && adjustedShifts.length > 0) {
    // Count how many existing shifts were adjusted vs new shifts added
    const existingShiftsCount = Math.min(adjustedShifts.length, lineSamplingData.value.length - index - 1)
    const newShiftsCount = Math.max(0, adjustedShifts.length - existingShiftsCount)

    // Apply adjusted shifts (replace existing ones)
    for (let i = 0; i < existingShiftsCount; i++) {
      const shiftIndex = index + 1 + i
      if (shiftIndex < lineSamplingData.value.length) {
        lineSamplingData.value[shiftIndex] = adjustedShifts[i]
      }
    }

    // Add new shifts if there are any
    if (newShiftsCount > 0) {
      const newShifts = adjustedShifts.slice(existingShiftsCount)
      for (const newShift of newShifts) {
        lineSamplingData.value.push(newShift)
      }
    }

    // Remove any remaining shifts that come after the adjusted shifts
    const firstShiftToRemove = index + 1 + adjustedShifts.length
    if (firstShiftToRemove < lineSamplingData.value.length) {
      const removedCount = lineSamplingData.value.length - firstShiftToRemove
      lineSamplingData.value.splice(firstShiftToRemove)
      
      if (newShiftsCount > 0 && removedCount > 0) {
        toast.success(`Line Sampling record updated, ${existingShiftsCount} shift(s) adjusted, ${newShiftsCount} shift(s) added, and ${removedCount} shift(s) removed`)
      } else if (newShiftsCount > 0) {
        toast.success(`Line Sampling record updated, ${existingShiftsCount} shift(s) adjusted, and ${newShiftsCount} shift(s) added to reach ETC`)
      } else if (removedCount > 0) {
        toast.success(`Line Sampling record updated, ${existingShiftsCount} shift(s) adjusted, and ${removedCount} shift(s) removed (ETC reached)`)
      } else {
        toast.success('Line Sampling record updated and subsequent shifts adjusted')
      }
    } else if (newShiftsCount > 0) {
      toast.success(`Line Sampling record updated, ${existingShiftsCount} shift(s) adjusted, and ${newShiftsCount} shift(s) added to reach ETC`)
    } else {
      toast.success('Line Sampling record updated and subsequent shifts adjusted')
    }
  } else {
    toast.success('Line Sampling record updated successfully')
  }

  // Exit edit mode
  editingLineIndex.value = null
  editingLineData.value = {
    who: '',
    startLineSampling: '',
    finishLineSampling: '',
    hours: ''
  }
  
  // Auto-save after editing (only lineSampling field will be sent)
  if (hasLineSamplingGenerated.value) {
    await autoSave()
  }
}

// Cancel editing Line Sampling
const cancelLineSamplingEdit = () => {
  editingLineIndex.value = null
  editingLineData.value = {
    who: '',
    startLineSampling: '',
    finishLineSampling: '',
    hours: ''
  }
}

// Helper function to parse date from flatpickr format (Y-m-d H:i) as local time
const parseLocalDateTime = (dateTimeString: string): Date => {
  // Format: '2025-11-13 14:00'
  const [datePart, timePart] = dateTimeString.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  // Create date in local timezone
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

// Auto generate state
const isGenerating = ref(false)

// Handle auto generate
const handleAutoGenerate = async () => {
  if (!formData.value.startDischarge || formData.value.dischargeTimeHours === null || formData.value.dischargeTimeHours === undefined) {
    toast.warning('Please fill in Start Discharge and Discharge Time (Hrs)')
    return
  }

  isGenerating.value = true

  try {
    // Get terminal information to check requiresLineSampling
    let requiresLineSampling = true // Default to true
    if (formData.value.terminal) {
      try {
        const terminalsResponse = await dropdownService.getTerminals()
        if (terminalsResponse.success && terminalsResponse.data) {
          const selectedTerminal = (terminalsResponse.data as Terminal[]).find(
            (t: Terminal) => t.name === formData.value.terminal
          )
          if (selectedTerminal) {
            requiresLineSampling = selectedTerminal.requiresLineSampling
          }
        }
      } catch (error) {
        console.error('Error fetching terminal info:', error)
        // Continue with default value
      }
    }

    // Get Office Sampling data if available
    const officeSamplingRecord = officeSamplingData.value.length > 0
      ? officeSamplingData.value[0]
      : undefined

    const officeSamplingFinish = officeSamplingRecord?.finishSamplingRaw
    const officeSamplingSampler = officeSamplingRecord?.who
    const officeSamplingStart = officeSamplingRecord?.startOfficeRaw

    // Convert startDischarge from flatpickr format (Y-m-d H:i) to ISO string
    // Parse as local time to avoid timezone issues
    let startDischargeDate: Date
    let startDischargeISO: string
    if (formData.value.startDischarge.includes('T') || formData.value.startDischarge.includes('Z')) {
      // Already in ISO format
      startDischargeDate = new Date(formData.value.startDischarge)
      startDischargeISO = formData.value.startDischarge
    } else {
      // Parse 'Y-m-d H:i' format as local time
      startDischargeDate = parseLocalDateTime(formData.value.startDischarge)
      startDischargeISO = startDischargeDate.toISOString()
    }

    // Convert ETC to ISO string if needed
    // If terminal doesn't require line sampling, calculate ETC from Start Discharge + Discharge Time Hours
    let etcISO: string | undefined
    if (!requiresLineSampling) {
      // For terminals without line sampling, calculate ETC from Start Discharge + Discharge Time Hours
      // Use the already parsed startDischargeDate to ensure correct local time calculation
      const etcDate = new Date(startDischargeDate.getTime() + formData.value.dischargeTimeHours * 60 * 60 * 1000)
      etcISO = etcDate.toISOString()
    } else if (formData.value.etc) {
      // Use ETC from form if provided (for terminals with line sampling)
      if (formData.value.etc.includes('T') || formData.value.etc.includes('Z')) {
        etcISO = formData.value.etc
      } else {
        const etcDate = new Date(formData.value.etc)
        etcISO = etcDate.toISOString()
      }
    }

    // Call autogenerate service
    const result = await autogenerateLineSampling(
      startDischargeISO,
      formData.value.dischargeTimeHours,
      officeSamplingFinish,
      lineSamplingData.value.length > 0 ? lineSamplingData.value : undefined,
      officeSamplingSampler,
      officeSamplingStart,
      requiresLineSampling,
      etcISO
    )

    if (result.success && result.data) {
      lineSamplingData.value = result.data

      toast.success(`Generated ${result.data.length} shift(s)`)
      hasLineSamplingGenerated.value = true

      // Auto-save after generating Line Sampling (only lineSampling field will be sent)
      await autoSave()
    } else {
      // Still populate shifts without samplers if data exists
      if (result.data) {
        lineSamplingData.value = result.data
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    toast.error(`Auto generate failed: ${errorMessage}`)
  } finally {
    isGenerating.value = false
  }
}

// Clear Line Sampling data
const clearLineSampling = () => {
  showClearConfirmModal.value = true
}

const confirmClearLineSampling = () => {
  lineSamplingData.value = []
  editingLineIndex.value = null
  editingLineData.value = {
    who: '',
    startLineSampling: '',
    finishLineSampling: '',
    hours: ''
  }
  hasLineSamplingGenerated.value = false

  // Auto-save after clearing (only lineSampling field will be sent)
  if (isEditing.value && editingId.value) {
    autoSave()
  }

  toast.success('Line Sampling data cleared')
}

// Load sampling roster from MongoDB
const loadSamplingRoster = async (amspecRef: string) => {
  try {
    const response = await getSamplingRosterByRef(amspecRef)
    if (response.success && response.data) {
      const roster = response.data
      
      // Fill form with saved data
      formData.value.vessel = roster.vessel
      formData.value.berth = roster.berth
      formData.value.amspecRef = roster.amspecRef
      formData.value.pob = roster.pob
      formData.value.etb = roster.etb
      
      // Convert startDischarge from ISO to flatpickr format
      if (roster.startDischarge) {
        const startDischargeDate = new Date(roster.startDischarge)
        const year = startDischargeDate.getFullYear()
        const month = String(startDischargeDate.getMonth() + 1).padStart(2, '0')
        const day = String(startDischargeDate.getDate()).padStart(2, '0')
        const hours = String(startDischargeDate.getHours()).padStart(2, '0')
        const minutes = String(startDischargeDate.getMinutes()).padStart(2, '0')
        formData.value.startDischarge = `${year}-${month}-${day} ${hours}:${minutes}`
      }
      
      formData.value.dischargeTimeHours = roster.dischargeTimeHours
      formData.value.cargo = roster.cargo
      formData.value.surveyor = roster.surveyor
      formData.value.preDischargeTest = roster.preDischargeTest || ''
      formData.value.postDischargeTest = roster.postDischargeTest || ''
      
      // Cancel any ongoing edit before loading data
      if (editingIndex.value !== null) {
        cancelOfficeSamplingEdit()
      }

      // Load Office Sampling data - clear first, then load if exists
      officeSamplingData.value = []
      if (roster.officeSampling && roster.officeSampling.length > 0) {
        officeSamplingData.value = roster.officeSampling.map(record => ({
          who: record.who,
          startOffice: formatDateTimeForTable(record.startOffice),
          startOfficeRaw: record.startOffice,
          finishSampling: formatDateTimeForTable(record.finishSampling),
          finishSamplingRaw: record.finishSampling,
          hours: `${record.hours.toFixed(2)} hrs`
        }))
      }
      
      // Load Line Sampling data - clear first, then load if exists
      lineSamplingData.value = []
      hasLineSamplingGenerated.value = false
      if (roster.lineSampling && roster.lineSampling.length > 0) {
        lineSamplingData.value = roster.lineSampling.map(record => ({
          who: record.who,
          startLineSampling: formatDateTimeForTable(record.startLineSampling),
          startLineSamplingRaw: record.startLineSampling,
          finishLineSampling: formatDateTimeForTable(record.finishLineSampling),
          finishLineSamplingRaw: record.finishLineSampling,
          hours: `${record.hours.toFixed(2)} hrs`
        }))
        hasLineSamplingGenerated.value = true
      }
      
      // Set editing state
      isEditing.value = true
      editingId.value = roster._id
      
      // Store original data for change detection
      originalData.value = {
        amspecRef: roster.amspecRef,
        vessel: roster.vessel,
        berth: roster.berth,
        pob: roster.pob,
        etb: roster.etb,
        etc: '',
        terminal: '',
        startDischarge: roster.startDischarge,
        dischargeTimeHours: roster.dischargeTimeHours,
        cargo: roster.cargo,
        surveyor: roster.surveyor,
        preDischargeTest: roster.preDischargeTest || '',
        postDischargeTest: roster.postDischargeTest || '',
        officeSampling: roster.officeSampling.map(r => ({
          who: r.who,
          startOffice: r.startOffice,
          finishSampling: r.finishSampling,
          hours: r.hours
        })),
        lineSampling: roster.lineSampling.map(r => ({
          who: r.who,
          startLineSampling: r.startLineSampling,
          finishLineSampling: r.finishLineSampling,
          hours: r.hours
        }))
      }
      
      hasUnsavedChanges.value = false
      
      toast.success('Sampling roster loaded from database')
      return true
    }
    // No data found - return false but don't clear here (will be cleared in selectShipNomination)
    return false
  } catch (error) {
    console.error('Error loading sampling roster:', error)
    return false
  }
}

// Select ship nomination and fill form
const selectShipNomination = async (ship: ShipNomination) => {
  // Clear previous data first to avoid showing stale data
  officeSamplingData.value = []
  lineSamplingData.value = []
  hasLineSamplingGenerated.value = false

  // Fill form with ship nomination data
  formData.value.vessel = ship.vesselName
  formData.value.berth = ship.berth || ''
  formData.value.amspecRef = ship.amspecReference
  formData.value.pob = ship.pilotOnBoard || ''
  formData.value.etb = ship.etb || ''
  formData.value.etc = ship.etc || ''
  formData.value.terminal = ship.terminal || ''
  formData.value.cargo = ship.productTypes?.join(', ') || ''
  formData.value.surveyor = ship.surveyor || ''

  // Calculate Start Discharge automatically: ETB + 3 hours
  if (ship.etb) {
    const etbDate = new Date(ship.etb)
    const startDischargeDate = new Date(etbDate.getTime() + (3 * 60 * 60 * 1000))
    // Format for flatpickr: 'Y-m-d H:i'
    const year = startDischargeDate.getFullYear()
    const month = String(startDischargeDate.getMonth() + 1).padStart(2, '0')
    const day = String(startDischargeDate.getDate()).padStart(2, '0')
    const hours = String(startDischargeDate.getHours()).padStart(2, '0')
    const minutes = String(startDischargeDate.getMinutes()).padStart(2, '0')
    formData.value.startDischarge = `${year}-${month}-${day} ${hours}:${minutes}`
  } else {
    formData.value.startDischarge = ''
  }

  // Reset discharge time hours (user will input manually)
  formData.value.dischargeTimeHours = null

  // Fill Pre/Post Discharge Testing with Chemist name
  formData.value.preDischargeTest = ship.chemist || ''
  formData.value.postDischargeTest = ship.chemist || ''

  // Close dropdown and clear search
  showDropdown.value = false
  searchQuery.value = `${ship.vesselName} - ${ship.amspecReference}`

  // Try to load existing sampling roster from MongoDB
  const loaded = await loadSamplingRoster(ship.amspecReference)
  if (!loaded) {
    // Cancel any ongoing edit before populating
    if (editingIndex.value !== null) {
      cancelOfficeSamplingEdit()
    }

    // No existing data found - populate Office Sampling from ship nomination
    populateOfficeSamplingTable(ship)

    // Reset editing state
    isEditing.value = false
    editingId.value = ''
    originalData.value = null
    hasUnsavedChanges.value = false
    toast.success('Form filled with ship nomination data')
  }
  // If loaded is true, loadSamplingRoster already populated Office Sampling from database
}

// Handle POB change - recalculate ETB, Start Discharge, and ETC
const handlePobChange = async (selectedDates: Date[]) => {
  if (selectedDates && selectedDates.length > 0) {
    const pobDate = new Date(selectedDates[0])

    // Calculate ETB: POB + 2 hours
    const etbDate = new Date(pobDate.getTime() + 2 * 60 * 60 * 1000)

    // Format ETB for flatpickr: 'Y-m-d H:i'
    const year = etbDate.getFullYear()
    const month = String(etbDate.getMonth() + 1).padStart(2, '0')
    const day = String(etbDate.getDate()).padStart(2, '0')
    const hours = String(etbDate.getHours()).padStart(2, '0')
    const minutes = String(etbDate.getMinutes()).padStart(2, '0')

    formData.value.etb = `${year}-${month}-${day} ${hours}:${minutes}`

    // Recalculate Start Discharge: ETB + 3 hours
    const startDischargeDate = new Date(etbDate.getTime() + 3 * 60 * 60 * 1000)
    const sdYear = startDischargeDate.getFullYear()
    const sdMonth = String(startDischargeDate.getMonth() + 1).padStart(2, '0')
    const sdDay = String(startDischargeDate.getDate()).padStart(2, '0')
    const sdHours = String(startDischargeDate.getHours()).padStart(2, '0')
    const sdMinutes = String(startDischargeDate.getMinutes()).padStart(2, '0')
    formData.value.startDischarge = `${sdYear}-${sdMonth}-${sdDay} ${sdHours}:${sdMinutes}`

    // Recalculate ETC: Start Discharge + Discharge Time Hours (if available)
    if (formData.value.dischargeTimeHours && formData.value.dischargeTimeHours > 0) {
      const etcDate = new Date(startDischargeDate.getTime() + formData.value.dischargeTimeHours * 60 * 60 * 1000)
      const etcYear = etcDate.getFullYear()
      const etcMonth = String(etcDate.getMonth() + 1).padStart(2, '0')
      const etcDay = String(etcDate.getDate()).padStart(2, '0')
      const etcHours = String(etcDate.getHours()).padStart(2, '0')
      const etcMinutes = String(etcDate.getMinutes()).padStart(2, '0')
      formData.value.etc = `${etcYear}-${etcMonth}-${etcDay} ${etcHours}:${etcMinutes}`
    }

    // Auto-save the changes
    if (hasLineSamplingGenerated.value && formData.value.pob && formData.value.etb) {
      await autoSave()
    }

    // Sync POB, ETB, and ETC with Ship Nomination
    await syncWithShipNomination('pob')
    await syncWithShipNomination('etb')
    if (formData.value.etc) {
      await syncWithShipNomination('etc')
    }
  }
}

// Handle ETB change - recalculate Start Discharge and validate
const handleEtbChange = async (selectedDates: Date[]) => {
  if (selectedDates && selectedDates.length > 0) {
    const etbDate = new Date(selectedDates[0])

    // Recalculate Start Discharge: ETB + 3 hours
    const startDischargeDate = new Date(etbDate.getTime() + 3 * 60 * 60 * 1000)

    // Format for flatpickr: 'Y-m-d H:i'
    const year = startDischargeDate.getFullYear()
    const month = String(startDischargeDate.getMonth() + 1).padStart(2, '0')
    const day = String(startDischargeDate.getDate()).padStart(2, '0')
    const hours = String(startDischargeDate.getHours()).padStart(2, '0')
    const minutes = String(startDischargeDate.getMinutes()).padStart(2, '0')

    formData.value.startDischarge = `${year}-${month}-${day} ${hours}:${minutes}`

    // Recalculate ETC: Start Discharge + Discharge Time Hours (if available)
    if (formData.value.dischargeTimeHours && formData.value.dischargeTimeHours > 0) {
      const etcDate = new Date(startDischargeDate.getTime() + formData.value.dischargeTimeHours * 60 * 60 * 1000)
      const etcYear = etcDate.getFullYear()
      const etcMonth = String(etcDate.getMonth() + 1).padStart(2, '0')
      const etcDay = String(etcDate.getDate()).padStart(2, '0')
      const etcHours = String(etcDate.getHours()).padStart(2, '0')
      const etcMinutes = String(etcDate.getMinutes()).padStart(2, '0')
      formData.value.etc = `${etcYear}-${etcMonth}-${etcDay} ${etcHours}:${etcMinutes}`
    }

    // Auto-save the changes
    if (hasLineSamplingGenerated.value && formData.value.etb) {
      await autoSave()
    }

    // Sync ETB with Ship Nomination
    await syncWithShipNomination('etb')

    // Sync recalculated ETC with Ship Nomination (if it was recalculated)
    if (formData.value.etc) {
      await syncWithShipNomination('etc')
    }
  }
}

// Handle Start Discharge change - recalculate ETC
const handleStartDischargeChange = async (selectedDates: Date[]) => {
  if (selectedDates && selectedDates.length > 0) {
    const startDischargeDate = new Date(selectedDates[0])

    // Recalculate ETC: Start Discharge + Discharge Time Hours (if available)
    if (formData.value.dischargeTimeHours && formData.value.dischargeTimeHours > 0) {
      const etcDate = new Date(startDischargeDate.getTime() + formData.value.dischargeTimeHours * 60 * 60 * 1000)
      const etcYear = etcDate.getFullYear()
      const etcMonth = String(etcDate.getMonth() + 1).padStart(2, '0')
      const etcDay = String(etcDate.getDate()).padStart(2, '0')
      const etcHours = String(etcDate.getHours()).padStart(2, '0')
      const etcMinutes = String(etcDate.getMinutes()).padStart(2, '0')
      formData.value.etc = `${etcYear}-${etcMonth}-${etcDay} ${etcHours}:${etcMinutes}`
    }

    // Auto-save the changes
    if (hasLineSamplingGenerated.value && formData.value.startDischarge) {
      await autoSave()
    }

    // Sync Start Discharge with Ship Nomination
    await syncWithShipNomination('startDischarge')

    // Sync recalculated ETC with Ship Nomination (if it was recalculated)
    if (formData.value.etc) {
      await syncWithShipNomination('etc')
    }
  }
}

// Handle ETC change - validate against Start Discharge
const handleEtcChange = async (selectedDates: Date[]) => {
  if (selectedDates && selectedDates.length > 0) {
    const etcDate = new Date(selectedDates[0])

    // Validate: ETC must be >= Start Discharge
    if (formData.value.startDischarge) {
      const startDischargeDate = new Date(formData.value.startDischarge)
      if (etcDate < startDischargeDate) {
        toast.warning('ETC must be after Start Discharge')
        // Clear the invalid value
        formData.value.etc = ''
        return
      }
    }

    // Auto-save the changes
    if (hasLineSamplingGenerated.value && formData.value.etc) {
      await autoSave()
    }

    // Sync ETC with Ship Nomination
    if (formData.value.etc) {
      await syncWithShipNomination('etc')
    }
  }
}

// Sync POB, ETB, ETC with Ship Nomination when changed in Sampling Roster
const syncWithShipNomination = async (field: 'pob' | 'etb' | 'etc' | 'startDischarge') => {
  if (!formData.value.amspecRef) return

  try {
    // Get the ship nomination by reference first
    const response = await checkAmspecReference(formData.value.amspecRef)
    if (!response.success || !response.data) {
      console.log('Ship nomination not found for reference:', formData.value.amspecRef)
      return
    }

    // Prepare update data
    const updateData: Partial<ShipNominationData> = {}

    // Map the field to the corresponding ship nomination field
    switch (field) {
      case 'pob':
        updateData.pilotOnBoard = formData.value.pob
        break
      case 'etb':
        updateData.etb = formData.value.etb
        break
      case 'etc':
        updateData.etc = formData.value.etc
        break
      case 'startDischarge':
        // Start Discharge is not stored in Ship Nomination, only in Sampling Roster
        // So we don't sync this field
        return
    }

    // Update the ship nomination
    await updateShipNomination(response.data._id, updateData)
  } catch (error) {
    console.error(`Error syncing ${field} with Ship Nomination:`, error)
  }
}

// Status badge class
const getStatusBadgeClass = (status?: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'approved':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

// Format date for display
const formatDateShort = (dateString: string) => {
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Close dropdown when clicking outside
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showDropdown.value = false
    }
  })
}

// Form data interface
interface SamplingRosterData {
  vessel: string
  berth: string
  amspecRef: string
  pob: string
  etb: string
  etc: string
  terminal: string
  startDischarge: string
  dischargeTimeHours: number | null
  cargo: string
  surveyor: string
  preDischargeTest: string
  postDischargeTest: string
}

// Form data
const formData = ref<SamplingRosterData>({
  vessel: '',
  berth: '',
  amspecRef: '',
  pob: '',
  etb: '',
  etc: '',
  terminal: '',
  startDischarge: '',
  dischargeTimeHours: null,
  cargo: '',
  surveyor: '',
  preDischargeTest: '',
  postDischargeTest: ''
})

// Date/Time picker configuration
const dateTimeConfig = {
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  altInput: true,
  altFormat: 'F j, Y at H:i',
  time_24hr: true,
  minuteIncrement: 15,
  locale: { firstDayOfWeek: 1 }
}

// Surveyor options (loaded from service)
const surveyorOptions = ref<string[]>([])

// Form submission
const isSubmitting = ref(false)
const isEditing = ref(false)
const editingId = ref<string>('')
const submittedOnce = ref(false)
const hasLineSamplingGenerated = ref(false)
const hasUnsavedChanges = ref(false)

// Confirmation modal for clearing Line Sampling
const showClearConfirmModal = ref(false)

// Sampler conflict modal state
const showConflictModal = ref(false)
const conflictModalData = ref<{
  samplerName: string
  reason: string
  previousShift?: {
    start: Date | string
    end: Date | string
    duration?: string
    source?: string
  }
  proposedShift: {
    start: Date | string
    end: Date | string
    duration?: string
  }
  restHours?: number
  weeklyHoursDetails?: {
    currentHours: number
    proposedHours: number
    totalHours: number
    maxHours: number
    existingShifts: Array<{
      start: Date | string
      end: Date | string
      duration: number
      source: string
    }>
  }
} | null>(null)
const pendingValidationAction = ref<(() => void) | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalData = ref<any>(null)

const validateForm = async () => {
  submittedOnce.value = true

  // Check all required fields
  if (!formData.value.vessel || !formData.value.berth || !formData.value.amspecRef ||
      !formData.value.pob || !formData.value.etb || !formData.value.startDischarge ||
      !formData.value.dischargeTimeHours || !formData.value.cargo || !formData.value.surveyor) {
    toast.warning('Please fill in all required fields')
    return false
  }

  // Validate discharge time hours is a positive number
  if (formData.value.dischargeTimeHours <= 0) {
    toast.warning('Discharge Time (Hrs) must be greater than 0')
    return false
  }

  // Terminal validation removed - user can save without sampler assignment

  return true
}

// Prepare data for saving
const prepareDataForSave = (): SamplingRosterDataService => {
  // Convert startDischarge to ISO format
  let startDischargeISO: string
  if (formData.value.startDischarge.includes('T') || formData.value.startDischarge.includes('Z')) {
    startDischargeISO = formData.value.startDischarge
  } else {
    const startDate = new Date(formData.value.startDischarge.replace(' ', 'T'))
    startDischargeISO = startDate.toISOString()
  }

  // Convert Office Sampling data
  const officeSampling = officeSamplingData.value.map(record => ({
    who: record.who,
    startOffice: record.startOfficeRaw,
    finishSampling: record.finishSamplingRaw,
    hours: parseFloat(record.hours.replace(' hrs', '')) || 0
  }))

  // Convert Line Sampling data
  const lineSampling = lineSamplingData.value.map(record => ({
    who: record.who,
    startLineSampling: record.startLineSamplingRaw,
    finishLineSampling: record.finishLineSamplingRaw,
    hours: parseFloat(record.hours.replace(' hrs', '')) || 0
  }))

  return {
    amspecRef: formData.value.amspecRef,
    vessel: formData.value.vessel,
    berth: formData.value.berth,
    pob: formData.value.pob,
    etb: formData.value.etb,
    startDischarge: startDischargeISO,
    dischargeTimeHours: formData.value.dischargeTimeHours || 0,
    cargo: formData.value.cargo,
    surveyor: formData.value.surveyor,
    preDischargeTest: formData.value.preDischargeTest,
    postDischargeTest: formData.value.postDischargeTest,
    officeSampling,
    lineSampling
  }
}

// Flag to prevent auto-save during initial loading
const isInitializing = ref(false)

// Auto-save function (uses upsert to handle both create and update)
const autoSave = async () => {
  // Skip auto-save if initializing or no line sampling generated yet
  if (isInitializing.value || !hasLineSamplingGenerated.value || !formData.value.amspecRef) {
    return
  }

  if (!(await validateForm())) {
    return
  }

  try {
    const currentData = prepareDataForSave()

    // For auto-save, use upsert which handles both create and update gracefully
    const response = await upsertSamplingRoster(formData.value.amspecRef, currentData)

    if (response.success && response.data) {
      isEditing.value = true
      editingId.value = response.data._id
      originalData.value = currentData
    }

    hasUnsavedChanges.value = false
    // Silent auto-save - no toast notification to avoid annoying the user
  } catch (error) {
    console.error('Auto-save error:', error)
    // Don't show error toast for auto-save to avoid annoying the user
  }
}

// Check for changes
const checkForChanges = () => {
  if (!originalData.value || !isEditing.value) {
    hasUnsavedChanges.value = false
    return
  }

  const currentData = prepareDataForSave()
  
  // Simple comparison - check if data has changed
  const originalStr = JSON.stringify(originalData.value)
  const currentStr = JSON.stringify(currentData)
  
  hasUnsavedChanges.value = originalStr !== currentStr
}

// Watch for changes in form data
watch([formData, officeSamplingData, lineSamplingData], () => {
  if (isEditing.value) {
    checkForChanges()
  }
}, { deep: true })

// Watch for dischargeTimeHours changes to recalculate ETC
watch(() => formData.value.dischargeTimeHours, (newValue) => {
  if (newValue && formData.value.startDischarge) {
    // Recalculate ETC when discharge time changes
    const startDischargeDate = new Date(formData.value.startDischarge)
    const etcDate = new Date(startDischargeDate.getTime() + newValue * 60 * 60 * 1000)
    const etcYear = etcDate.getFullYear()
    const etcMonth = String(etcDate.getMonth() + 1).padStart(2, '0')
    const etcDay = String(etcDate.getDate()).padStart(2, '0')
    const etcHours = String(etcDate.getHours()).padStart(2, '0')
    const etcMinutes = String(etcDate.getMinutes()).padStart(2, '0')
    formData.value.etc = `${etcYear}-${etcMonth}-${etcDay} ${etcHours}:${etcMinutes}`
  }
})

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  if (!(await validateForm())) {
    isSubmitting.value = false
    return
  }

  if (!hasLineSamplingGenerated.value) {
    toast.warning('Please generate Line Sampling first')
    isSubmitting.value = false
    return
  }

  // Validate all sampler restrictions before saving
  for (let i = 0; i < lineSamplingData.value.length; i++) {
    const shift = lineSamplingData.value[i]
    if (!shift.who || !shift.startLineSamplingRaw || !shift.finishLineSamplingRaw) continue
    
    const shiftStart = new Date(shift.startLineSamplingRaw)
    const shiftEnd = new Date(shift.finishLineSamplingRaw)
    
    const restrictionValidation = await validateSamplerRestrictions(
      shift.who,
      shiftStart,
      shiftEnd,
      i
    )
    
    if (!restrictionValidation.valid) {
      // If conflict details are available, show override modal
      if (restrictionValidation.conflictDetails) {
        const proposedDuration = calculateHoursNumber(shiftStart, shiftEnd)
        conflictModalData.value = {
          samplerName: shift.who,
          reason: restrictionValidation.reason || 'Sampler validation failed',
          previousShift: restrictionValidation.conflictDetails.previousShift,
          proposedShift: {
            start: shiftStart,
            end: shiftEnd,
            duration: `${proposedDuration.toFixed(1)}h`
          },
          restHours: restrictionValidation.conflictDetails.restHours,
          weeklyHoursDetails: restrictionValidation.conflictDetails.weeklyHoursDetails
        }
        // Store the action to execute after override
        pendingValidationAction.value = () => {
          // Continue with save after override confirmation
          continueSave()
        }
        showConflictModal.value = true
        isSubmitting.value = false
        return
      } else {
        // No conflict details, show error toast
        toast.error(`Shift ${i + 1}: ${restrictionValidation.reason || 'Sampler validation failed'}`)
        isSubmitting.value = false
        return
      }
    }
  }

  // All validations passed, proceed with save
  await continueSave()
}

// Continue save after override confirmation
const continueSave = async () => {
  try {
    const dataToSave = prepareDataForSave()
    
    if (isEditing.value && editingId.value) {
      const response = await updateSamplingRoster(editingId.value, dataToSave as Partial<SamplingRosterDataService>)
      if (response.success && response.data) {
        originalData.value = dataToSave
        hasUnsavedChanges.value = false
        toast.success('Sampling roster updated successfully')
      } else {
        toast.error(response.message || 'Failed to update sampling roster')
      }
    } else {
      const response = await createSamplingRoster(dataToSave)
      if (response.success && response.data) {
        isEditing.value = true
        editingId.value = response.data._id
        originalData.value = dataToSave
        hasUnsavedChanges.value = false
        toast.success('Sampling roster saved successfully')
      } else {
        toast.error(response.message || 'Failed to save sampling roster')
      }
    }
  } catch (error) {
    console.error('Save error:', error)
    toast.error('Failed to save sampling roster')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formData.value = {
    vessel: '',
    berth: '',
    amspecRef: '',
    pob: '',
    etb: '',
    etc: '',
    terminal: '',
    startDischarge: '',
    dischargeTimeHours: null,
    cargo: '',
    surveyor: '',
    preDischargeTest: '',
    postDischargeTest: ''
  }
  officeSamplingData.value = []
  lineSamplingData.value = []
  submittedOnce.value = false
  isEditing.value = false
  editingId.value = ''
  searchQuery.value = ''
  hasLineSamplingGenerated.value = false
  hasUnsavedChanges.value = false
  originalData.value = null
}

const cancelEdit = () => {
  resetForm()
}

// Load ship nominations and surveyors on component mount
onMounted(async () => {
  // Load only last 5 ship nominations initially
  await loadInitialShipNominations()

  // Load surveyor options
  const surveyorsResponse = await dropdownService.getSurveyors(true)
  if (surveyorsResponse.success && surveyorsResponse.data) {
    surveyorOptions.value = surveyorsResponse.data.map((s: { name: string }) => s.name)
  }

  // Load sampler options for Office Sampling dropdown (with full data for validation)
  const samplersResponse = await dropdownService.getSamplers(true)
  if (samplersResponse.success && samplersResponse.data) {
    samplerOptions.value = samplersResponse.data.map((s: { name: string }) => s.name)
    samplersData.value = samplersResponse.data as SamplerData[]
  }
})
</script>
